import { Hono } from 'hono';
import { db } from '@atlas-lms/database';
import { eq } from 'drizzle-orm';
import { users } from '@atlas-lms/database/schema';
import { LtiService, JwtService } from '@atlas-lms/auth';
import type { OidcLoginInitParams } from '@atlas-lms/auth';

const router = new Hono();
const ltiService = new LtiService(db);
const jwtService = new JwtService();

/**
 * POST /lti/login
 * LTI 1.3 OIDC Login Initiation — platform sends us the login hint params,
 * we redirect to the platform's OIDC authorization endpoint.
 * Spec: IMS LTI 1.3 §4.1
 */
router.post('/login', async (c) => {
  // Accept both JSON body and form-post (platforms vary)
  let params: Partial<OidcLoginInitParams>;

  const contentType = c.req.header('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    params = await c.req.json<Partial<OidcLoginInitParams>>();
  } else {
    // form-post
    const form = await c.req.formData();
    params = {
      iss: form.get('iss')?.toString(),
      loginHint: form.get('login_hint')?.toString(),
      targetLinkUri: form.get('target_link_uri')?.toString(),
      ltiMessageHint: form.get('lti_message_hint')?.toString() ?? undefined,
      clientId: form.get('client_id')?.toString() ?? undefined,
      deploymentId: form.get('lti_deployment_id')?.toString() ?? undefined,
    };
  }

  if (!params.iss || !params.loginHint || !params.targetLinkUri) {
    return c.json(
      { error: 'VALIDATION_ERROR', message: 'iss, login_hint, and target_link_uri are required' },
      422
    );
  }

  const { redirectUrl } = await ltiService.initiateLogin(params as OidcLoginInitParams);
  return c.redirect(redirectUrl, 302);
});

/**
 * POST /lti/launch
 * LTI 1.3 Authentication Response — platform POSTs back the signed id_token.
 * We validate it, find or provision the user, and issue an Atlas JWT.
 * Spec: IMS LTI 1.3 §4.3
 */
router.post('/launch', async (c) => {
  const form = await c.req.formData();
  const state = form.get('state')?.toString();
  const idToken = form.get('id_token')?.toString();

  if (!state || !idToken) {
    return c.json(
      { error: 'VALIDATION_ERROR', message: 'state and id_token are required' },
      422
    );
  }

  const launchResult = await ltiService.validateLaunch({ state, idToken });

  // Map LTI role to Atlas role
  const atlasRole = LtiService.mapLtiRolesToAtlasRole(launchResult.roles);

  // Find user by email (provisioning by email is the most portable approach)
  let atlasUser = launchResult.email
    ? (
        await db
          .select()
          .from(users)
          .where(eq(users.email, launchResult.email))
          .limit(1)
      )[0]
    : undefined;

  // Just-in-time provisioning if the user doesn't exist
  if (!atlasUser && launchResult.email) {
    const [newUser] = await db
      .insert(users)
      .values({
        orgDefinedId: launchResult.platformUserId,
        loginId: launchResult.email.split('@')[0] ?? launchResult.platformUserId,
        email: launchResult.email,
        firstName: launchResult.firstName ?? 'Unknown',
        lastName: launchResult.lastName ?? 'User',
        isSystemAdmin: false,
      })
      .returning();
    atlasUser = newUser;
  }

  if (!atlasUser) {
    return c.json(
      { error: 'NOT_FOUND', message: 'Could not resolve or provision Atlas user for this LTI launch' },
      404
    );
  }

  // Issue access token
  const token = await jwtService.signAccessToken({
    sub: atlasUser.id,
    orgDefinedId: atlasUser.orgDefinedId,
    loginId: atlasUser.loginId,
    role: atlasRole,
    contextShellId: launchResult.contextId,
    ltiLaunch: true,
  });

  // In a real deployment you'd redirect to the SPA with the token in a
  // secure cookie or short-lived code. Returning JSON here for API clients.
  return c.json({
    data: {
      token,
      user: {
        id: atlasUser.id,
        loginId: atlasUser.loginId,
        firstName: atlasUser.firstName,
        lastName: atlasUser.lastName,
        role: atlasRole,
        contextShellId: launchResult.contextId,
      },
    },
  });
});

export { router as ltiRouter };
