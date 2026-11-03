import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from 'jose';
import { eq, and } from 'drizzle-orm';
import { lti13Authz } from '@atlas-lms/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@atlas-lms/database/schema';
import type {
  OidcLoginInitParams,
  LtiIdTokenClaims,
  LtiLaunchResult,
} from './types';

type DrizzleDb = PostgresJsDatabase<typeof schema>;

// IMS Global LTI 1.3 role URNs
const INSTRUCTOR_ROLES = new Set([
  'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
  'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor',
  'http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper',
]);

const TA_ROLES = new Set([
  'http://purl.imsglobal.org/vocab/lis/v2/membership#TeachingAssistant',
  'http://purl.imsglobal.org/vocab/lis/v2/membership/Instructor#TeachingAssistant',
]);

const STUDENT_ROLES = new Set([
  'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
  'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student',
]);

/**
 * In-memory nonce store for replay attack prevention.
 * Replace with Redis / DB-backed store for multi-node deployments.
 */
class NonceStore {
  // nonce → expiry timestamp (ms)
  private readonly store = new Map<string, number>();
  private readonly TTL_MS = 10 * 60 * 1000; // 10 minutes

  consume(nonce: string): boolean {
    this.evict();
    if (this.store.has(nonce)) return false; // already used
    this.store.set(nonce, Date.now() + this.TTL_MS);
    return true;
  }

  private evict() {
    const now = Date.now();
    for (const [k, exp] of this.store) {
      if (exp < now) this.store.delete(k);
    }
  }
}

/**
 * In-memory state store for OIDC login flow (state → OidcLoginInitParams).
 * Replace with Redis for multi-node deployments.
 */
class StateStore {
  private readonly store = new Map<string, { params: OidcLoginInitParams; expiry: number }>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  save(state: string, params: OidcLoginInitParams): void {
    this.evict();
    this.store.set(state, { params, expiry: Date.now() + this.TTL_MS });
  }

  consume(state: string): OidcLoginInitParams | null {
    this.evict();
    const entry = this.store.get(state);
    if (!entry) return null;
    this.store.delete(state);
    return entry.params;
  }

  private evict() {
    const now = Date.now();
    for (const [k, v] of this.store) {
      if (v.expiry < now) this.store.delete(k);
    }
  }
}

export class LtiService {
  private readonly nonceStore = new NonceStore();
  private readonly stateStore = new StateStore();

  constructor(private readonly db: DrizzleDb) {}

  /**
   * Step 1 — OIDC Login Initiation.
   *
   * The platform POSTs to our /lti/login endpoint with the params below.
   * We validate the registration exists, generate state + nonce, save state,
   * and return the redirect URL to the platform's OIDC auth endpoint.
   *
   * Spec: IMS LTI 1.3 §4.1
   */
  async initiateLogin(params: OidcLoginInitParams): Promise<{
    redirectUrl: string;
    state: string;
  }> {
    // Look up the LTI registration for this issuer
    const [registration] = await this.db
      .select()
      .from(lti13Authz)
      .where(
        and(
          eq(lti13Authz.issuer, params.iss),
          eq(lti13Authz.isActive, true)
        )
      )
      .limit(1);

    if (!registration) {
      throw new Error(`No active LTI 1.3 registration found for issuer: ${params.iss}`);
    }

    // Validate client_id if the platform sent one
    if (params.clientId && params.clientId !== registration.clientId) {
      throw new Error('client_id mismatch — possible misconfiguration');
    }

    // Generate cryptographically random state and nonce
    const state = this.generateRandomString(32);
    const nonce = this.generateRandomString(32);

    // Persist state → original params mapping
    this.stateStore.save(state, params);

    // Build OIDC authentication request URL
    const authUrl = new URL(registration.oidcAuthUrl);
    authUrl.searchParams.set('scope', 'openid');
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('response_mode', 'form_post');
    authUrl.searchParams.set('prompt', 'none');
    authUrl.searchParams.set('client_id', registration.clientId);
    authUrl.searchParams.set('redirect_uri', params.targetLinkUri);
    authUrl.searchParams.set('login_hint', params.loginHint);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);

    if (params.ltiMessageHint) {
      authUrl.searchParams.set('lti_message_hint', params.ltiMessageHint);
    }

    return { redirectUrl: authUrl.toString(), state };
  }

  /**
   * Step 2 — Authentication Response (Launch).
   *
   * The platform POSTs back to our /lti/launch endpoint with:
   *   - state (must match what we sent)
   *   - id_token (signed JWT from platform)
   *
   * We validate state, fetch JWKS, verify the token, validate nonce,
   * and return the structured launch result.
   *
   * Spec: IMS LTI 1.3 §4.3
   */
  async validateLaunch(params: {
    state: string;
    idToken: string;
  }): Promise<LtiLaunchResult> {
    // Recover and consume state
    const savedParams = this.stateStore.consume(params.state);
    if (!savedParams) {
      throw new Error('Invalid or expired OIDC state parameter — possible CSRF');
    }

    // Look up registration again by issuer
    const [registration] = await this.db
      .select()
      .from(lti13Authz)
      .where(
        and(
          eq(lti13Authz.issuer, savedParams.iss),
          eq(lti13Authz.isActive, true)
        )
      )
      .limit(1);

    if (!registration) {
      throw new Error(`No active registration for issuer: ${savedParams.iss}`);
    }

    // Fetch platform JWKS and verify token signature
    const JWKS = createRemoteJWKSet(new URL(registration.jwksUri));

    const { payload } = await jwtVerify(params.idToken, JWKS, {
      issuer: registration.issuer,
      audience: registration.clientId,
    });

    const claims = payload as JWTPayload & LtiIdTokenClaims;

    // Validate LTI version
    if (claims['https://purl.imsglobal.org/spec/lti/claim/version'] !== '1.3.0') {
      throw new Error('Unsupported LTI version — only 1.3.0 accepted');
    }

    // Validate message type
    const msgType = claims['https://purl.imsglobal.org/spec/lti/claim/message_type'];
    if (msgType !== 'LtiResourceLinkRequest' && msgType !== 'LtiDeepLinkingRequest') {
      throw new Error(`Unsupported LTI message type: ${msgType}`);
    }

    // Validate and consume nonce (replay attack prevention)
    if (!claims.nonce) {
      throw new Error('Missing nonce in LTI id_token');
    }
    if (!this.nonceStore.consume(claims.nonce)) {
      throw new Error('Nonce already used — possible replay attack');
    }

    // Extract context (course shell) ID
    const context = claims['https://purl.imsglobal.org/spec/lti/claim/context'];
    const roles = claims['https://purl.imsglobal.org/spec/lti/claim/roles'] ?? [];
    const customClaims =
      claims['https://purl.imsglobal.org/spec/lti/claim/custom'] ?? {};

    return {
      platformUserId: claims.sub,
      email: claims.email,
      firstName: claims.given_name,
      lastName: claims.family_name,
      roles,
      contextId: context?.id,
      deploymentId: claims['https://purl.imsglobal.org/spec/lti/claim/deployment_id'],
      targetLinkUri: claims['https://purl.imsglobal.org/spec/lti/claim/target_link_uri'],
      customClaims,
    };
  }

  /**
   * Maps IMS LTI role URNs to the AtlasLMS enrollment role enum.
   * Instructor > TA > Student priority order.
   */
  static mapLtiRolesToAtlasRole(
    roles: string[]
  ): 'Student' | 'Instructor' | 'TA' | 'Designer' | 'Auditor' {
    const roleSet = new Set(roles);

    if ([...roleSet].some(r => INSTRUCTOR_ROLES.has(r))) return 'Instructor';
    if ([...roleSet].some(r => TA_ROLES.has(r))) return 'TA';
    if ([...roleSet].some(r => STUDENT_ROLES.has(r))) return 'Student';

    // ContentDeveloper → Designer
    if (roles.includes('http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper')) {
      return 'Designer';
    }

    return 'Student'; // Safe default
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private generateRandomString(length: number): string {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Buffer.from(bytes).toString('base64url').slice(0, length);
  }
}
