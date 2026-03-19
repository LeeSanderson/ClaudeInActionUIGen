import { test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const mockSign = vi.fn(() => Promise.resolve("mock-jwt-token"));

vi.mock("jose", () => ({
  SignJWT: vi.fn(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  })),
  jwtVerify: vi.fn(),
}));

import { createSession, getSession, deleteSession, verifySession } from "../auth";
import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

beforeEach(() => {
  vi.clearAllMocks();
  mockCookieStore.get.mockReturnValue(undefined);
});

// createSession

test("createSession sets an httpOnly cookie with the JWT token", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name, token, options] = mockCookieStore.set.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(token).toBe("mock-jwt-token");
  expect(options.httpOnly).toBe(true);
  expect(options.secure).toBe(false);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
  expect(options.expires).toBeInstanceOf(Date);
});

// getSession

test("getSession returns session payload when valid token exists", async () => {
  const mockPayload = {
    userId: "user-123",
    email: "test@example.com",
    expiresAt: new Date().toISOString(),
  };
  mockCookieStore.get.mockReturnValue({ value: "valid-token" });
  (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

  const session = await getSession();

  expect(session).toEqual(mockPayload);
  expect(jwtVerify).toHaveBeenCalledWith("valid-token", expect.anything());
});

test("getSession returns null when no cookie exists", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const session = await getSession();

  expect(session).toBeNull();
  expect(jwtVerify).not.toHaveBeenCalled();
});

test("getSession returns null when jwtVerify throws", async () => {
  mockCookieStore.get.mockReturnValue({ value: "invalid-token" });
  (jwtVerify as any).mockRejectedValue(new Error("invalid token"));

  const session = await getSession();

  expect(session).toBeNull();
});

// deleteSession

test("deleteSession removes the auth cookie", async () => {
  await deleteSession();

  expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
});

// verifySession

test("verifySession returns session payload from request cookies", async () => {
  const mockPayload = {
    userId: "user-123",
    email: "test@example.com",
    expiresAt: new Date().toISOString(),
  };
  (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

  const request = new NextRequest("http://localhost:3000/api/test", {
    headers: { cookie: "auth-token=valid-token" },
  });

  const session = await verifySession(request);

  expect(session).toEqual(mockPayload);
  expect(jwtVerify).toHaveBeenCalledWith("valid-token", expect.anything());
});

test("verifySession returns null when request has no token cookie", async () => {
  const request = new NextRequest("http://localhost:3000/api/test");

  const session = await verifySession(request);

  expect(session).toBeNull();
  expect(jwtVerify).not.toHaveBeenCalled();
});

test("verifySession returns null when jwtVerify throws", async () => {
  (jwtVerify as any).mockRejectedValue(new Error("expired token"));

  const request = new NextRequest("http://localhost:3000/api/test", {
    headers: { cookie: "auth-token=expired-token" },
  });

  const session = await verifySession(request);

  expect(session).toBeNull();
});
