import assert from "node:assert/strict";
import { test } from "node:test";
import { maskPii } from "./maskPii";

test("masks email addresses", () => {
    const result = maskPii("Contact me at sakshi@example.com");

    assert.equal(result, "Contact me at [EMAIL REDACTED]");
});

test("masks Indian mobile numbers", () => {
    const result = maskPii("Call me at 9876543210");

    assert.equal(result, "Call me at [PHONE REDACTED]");
});

test("masks international phone numbers", () => {
    const result = maskPii("Call me at +1 415 555 2671");

    assert.equal(result, "Call me at [PHONE REDACTED]");
});

test("masks email and phone together", () => {
    const result = maskPii(
        "Email sakshi@example.com or call 9876543210"
    );

    assert.equal(
        result,
        "Email [EMAIL REDACTED] or call [PHONE REDACTED]"
    );
});

test("keeps ordinary short numbers unchanged", () => {
    const result = maskPii("Ticket number is 123456");

    assert.equal(result, "Ticket number is 123456");
});

test("keeps the original input unchanged", () => {
    const original = "Email sakshi@example.com and phone 9876543210";

    maskPii(original);

    assert.equal(
        original,
        "Email sakshi@example.com and phone 9876543210"
    );
});