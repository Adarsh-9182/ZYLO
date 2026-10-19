import { test } from "node:test";
import assert from "node:assert/strict";
import { customerReturnTo } from "../src/lib/customer-auth/return-to";
import { customerAuthError } from "../src/lib/customer-auth/errors";
import {
  canTransition,
  csvCell,
  emailAddress,
  externalUrl,
  imageUrl,
  number,
} from "../src/lib/admin/validation";
test("terminal orders cannot be reopened or restocked twice", () => {
  for (const terminal of ["cancelled", "returned"]) {
    assert.equal(canTransition(terminal, "confirmed"), false);
    assert.equal(canTransition(terminal, terminal), true);
  }
  assert.equal(canTransition("placed", "shipped"), false);
  assert.equal(canTransition("shipped", "returned"), true);
});
test("CSV cells neutralize formulas including whitespace prefixes", () => {
  for (const value of ["=1+1", " +SUM(A1)", "@cmd", "\t=2", "-1+2"]) {
    assert.ok(csvCell(value).startsWith("\"'"));
  }
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
});
test("images and tracking links reject active or credentialed URLs", () => {
  assert.equal(imageUrl("/media/123"), "/media/123");
  for (const bad of [
    "javascript:alert(1)",
    "//evil.test/a.png",
    "data:image/svg+xml,test",
    "https://user:password@example.com/x",
  ]) {
    assert.throws(() => imageUrl(bad));
  }
  assert.throws(() => externalUrl("javascript:alert(1)"));
  assert.equal(
    externalUrl("https://example.com/track"),
    "https://example.com/track",
  );
});
test("stock quantities must be bounded integers", () => {
  const f = new FormData();
  f.set("stock", "1.5");
  assert.throws(() => number(f, "stock", 0, 1000000));
  f.set("stock", "-1");
  assert.throws(() => number(f, "stock", 0, 1000000));
  f.set("stock", "0");
  assert.equal(number(f, "stock", 0, 1000000), 0);
});
test("customer emails normalize for a single history", () => {
  assert.equal(emailAddress(" Buyer@Example.com "), "buyer@example.com");
  assert.throws(() => emailAddress("not-an-email"));
});
test("customer login return destinations cannot redirect to external sites", () => {
  for (const value of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/admin",
    "/account?next=https://evil.test",
    "javascript:alert(1)",
  ]) {
    assert.equal(customerReturnTo(value), "/account");
  }
  assert.equal(customerReturnTo("/checkout"), "/checkout");
  assert.equal(
    customerReturnTo("/order/ZY-ABCDEFGHJKLM"),
    "/order/ZY-ABCDEFGHJKLM",
  );
});
test("auth failures give useful credential feedback and hide provider configuration", () => {
  assert.equal(
    customerAuthError({ status: 401 }),
    "Email or password is incorrect.",
  );
  assert.equal(
    customerAuthError(new Error("Invalid email or password")),
    "Email or password is incorrect.",
  );
  assert.equal(
    customerAuthError({ message: "Invalid callbackURL" }),
    "Sign-in is temporarily unavailable. Please try again shortly.",
  );
  assert.match(customerAuthError({ status: 429 }), /wait a few minutes/);
});
