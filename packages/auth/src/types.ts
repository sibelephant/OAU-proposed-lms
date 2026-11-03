// ─── Session & Token Types ────────────────────────────────────────────────────

export type UserRole = 'Student' | 'Instructor' | 'TA' | 'Designer' | 'Auditor' | 'SystemAdmin';

/**
 * Payload embedded inside every AtlasLMS JWT.
 * Kept small — no PII beyond the IDs needed to re-hydrate session context.
 */
export interface AtlasJwtPayload {
  /** Atlas user UUID (users.id) */
  sub: string;
  /** UGA OrgDefinedID / matric number */
  orgDefinedId: string;
  /** IU loginId / UGA MyID */
  loginId: string;
  /** Effective role for the current context (may be shell-scoped via contextShellId) */
  role: UserRole;
  /** If present, this token is scoped to a specific course shell */
  contextShellId?: string;
  /** Whether this session was established via LTI 1.3 launch */
  ltiLaunch?: boolean;
  /** Standard JWT issued-at (seconds since epoch) */
  iat?: number;
  /** Standard JWT expiry (seconds since epoch) */
  exp?: number;
}

/**
 * Decoded & verified token returned by JwtService.verify()
 */
export interface VerifiedSession {
  payload: AtlasJwtPayload;
  /** Raw JWT string (useful for forwarding to downstream services) */
  token: string;
}

// ─── LTI 1.3 Types ───────────────────────────────────────────────────────────

/**
 * Standard OIDC login hint parameters sent to the platform's OIDC auth endpoint.
 * Follows IMS Global LTI 1.3 §4.1 login initiation.
 */
export interface OidcLoginInitParams {
  iss: string;            // Platform issuer (e.g., "https://canvas.instructure.com")
  loginHint: string;      // Opaque platform-side user identifier
  targetLinkUri: string;  // Deep-link destination in the tool
  ltiMessageHint?: string;
  clientId?: string;
  deploymentId?: string;
}

/**
 * Decoded IMS LTI 1.3 ID-token claims (subset used for launch).
 */
export interface LtiIdTokenClaims {
  // Standard OIDC
  iss: string;
  sub: string;           // Platform-side user identifier
  aud: string | string[];
  exp: number;
  iat: number;
  nonce: string;

  // LTI 1.3 core claims
  'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest' | 'LtiDeepLinkingRequest';
  'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0';
  'https://purl.imsglobal.org/spec/lti/claim/deployment_id': string;
  'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': string;

  // Resource link
  'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
    id: string;
    title?: string;
  };

  // Roles (IMS URN format)
  'https://purl.imsglobal.org/spec/lti/claim/roles': string[];

  // Context (course shell mapping)
  'https://purl.imsglobal.org/spec/lti/claim/context'?: {
    id: string;
    label?: string;
    title?: string;
  };

  // User identity (optional — platform may omit)
  given_name?: string;
  family_name?: string;
  email?: string;

  // Custom claims (institution-defined)
  'https://purl.imsglobal.org/spec/lti/claim/custom'?: Record<string, string>;
}

/**
 * Result of a successful LTI 1.3 launch — everything needed to create an AtlasLMS session.
 */
export interface LtiLaunchResult {
  platformUserId: string;   // LTI sub
  email?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];          // Raw IMS URN role strings
  contextId?: string;       // LTI context.id → maps to courseShell
  deploymentId: string;
  targetLinkUri: string;
  customClaims: Record<string, string>;
}
