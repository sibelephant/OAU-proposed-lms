import {
  SignJWT,
  jwtVerify,
  type JWTPayload,
  importPKCS8,
  importSPKI,
  generateKeyPair,
} from 'jose';
import type { AtlasJwtPayload, VerifiedSession } from './types';

const DEFAULT_ACCESS_TTL = '8h';   // Long enough for a full teaching day
const DEFAULT_REFRESH_TTL = '30d';

export interface JwtServiceConfig {
  /**
   * RSA private key in PKCS#8 PEM format.
   * Falls back to a symmetric secret (HS256) when omitted — suitable for
   * single-node dev but use RS256 in production so the API can verify
   * without the private key.
   */
  privateKeyPem?: string;
  /** RSA public key in SPKI PEM format (required when privateKeyPem is set) */
  publicKeyPem?: string;
  /**
   * Symmetric secret for HS256 (used when RSA keys are not configured).
   * Must be ≥32 bytes. Reads from JWT_SECRET env var when omitted.
   */
  secret?: string;
  issuer?: string;
  audience?: string;
}

export class JwtService {
  private readonly issuer: string;
  private readonly audience: string;
  private privateKeyPem?: string;
  private publicKeyPem?: string;
  private secret: string;

  constructor(config: JwtServiceConfig = {}) {
    this.issuer = config.issuer ?? 'atlas-lms';
    this.audience = config.audience ?? 'atlas-lms-api';
    this.privateKeyPem = config.privateKeyPem;
    this.publicKeyPem = config.publicKeyPem;
    this.secret =
      config.secret ??
      process.env['JWT_SECRET'] ??
      'atlas-lms-dev-secret-change-in-production-min-32chars';
  }

  /**
   * Signs an access token (short-lived) for the given payload.
   */
  async signAccessToken(
    payload: Omit<AtlasJwtPayload, 'iat' | 'exp'>,
    ttl: string = DEFAULT_ACCESS_TTL
  ): Promise<string> {
    return this.sign(payload, ttl);
  }

  /**
   * Signs a refresh token (long-lived, minimal claims).
   */
  async signRefreshToken(userId: string, ttl: string = DEFAULT_REFRESH_TTL): Promise<string> {
    return this.sign(
      { sub: userId, orgDefinedId: '', loginId: '', role: 'Student' } satisfies Omit<AtlasJwtPayload, 'iat' | 'exp'>,
      ttl
    );
  }

  /**
   * Verifies and decodes an Atlas JWT.
   * Throws if the token is expired, has wrong issuer/audience, or fails signature.
   */
  async verify(token: string): Promise<VerifiedSession> {
    let payload: JWTPayload & AtlasJwtPayload;

    if (this.privateKeyPem && this.publicKeyPem) {
      const publicKey = await importSPKI(this.publicKeyPem, 'RS256');
      const result = await jwtVerify(token, publicKey, {
        issuer: this.issuer,
        audience: this.audience,
      });
      payload = result.payload as JWTPayload & AtlasJwtPayload;
    } else {
      const secretKey = new TextEncoder().encode(this.secret);
      const result = await jwtVerify(token, secretKey, {
        issuer: this.issuer,
        audience: this.audience,
      });
      payload = result.payload as JWTPayload & AtlasJwtPayload;
    }

    return { payload, token };
  }

  /**
   * Generates a fresh RS256 key pair (useful for bootstrapping dev environments).
   * Returns PEM-encoded private and public keys.
   */
  static async generateKeyPair(): Promise<{ privateKeyPem: string; publicKeyPem: string }> {
    const { privateKey, publicKey } = await generateKeyPair('RS256', {
      modulusLength: 2048,
      extractable: true,
    });

    // jose exports keys as crypto.CryptoKey — we need PEM
    const { exportSPKI, exportPKCS8 } = await import('jose');
    const [privateKeyPem, publicKeyPem] = await Promise.all([
      exportPKCS8(privateKey),
      exportSPKI(publicKey),
    ]);

    return { privateKeyPem, publicKeyPem };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async sign(
    payload: Omit<AtlasJwtPayload, 'iat' | 'exp'>,
    ttl: string
  ): Promise<string> {
    const builder = new SignJWT(payload as JWTPayload)
      .setProtectedHeader({ alg: this.privateKeyPem ? 'RS256' : 'HS256' })
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setExpirationTime(ttl);

    if (this.privateKeyPem) {
      const privateKey = await importPKCS8(this.privateKeyPem, 'RS256');
      return builder.sign(privateKey);
    }

    const secretKey = new TextEncoder().encode(this.secret);
    return builder.sign(secretKey);
  }
}
