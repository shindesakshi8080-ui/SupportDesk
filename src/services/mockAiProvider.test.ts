import test from "node:test";
import assert from "node:assert/strict";
import mockAiProvider from "./mockAiProvider";

test("mock reply generation is deterministic and streams completed text", async () => {
    const input = JSON.stringify({
        title: "Payment error",
        description: "Payment is not processing",
        comments: ["I tried again but the error continues"],
    });

    const collectReply = async () => {
        const events = await mockAiProvider.streamReply(
            input,
            new AbortController().signal
        );

        let output = "";
        let completed = false;

        for await (const event of events) {
            if (event.type === "delta") output += event.text;
            if (event.type === "completed") completed = true;
        }

        return { output, completed };
    };

    const first = await collectReply();
    const second = await collectReply();

    assert.equal(first.output, second.output);
    assert.equal(first.completed, true);
    assert.match(first.output, /Payment error/);
});

test("mock categorization returns a valid category and priority", async () => {
    const input = JSON.stringify({
        title: "Payment error",
        description: "Unable to complete payment",
        comments: [],
    });

    const result = await mockAiProvider.classify(
        input,
        ["Payment", "Technical", "Account"],
        new AbortController().signal
    );

    assert.equal(result.status, "completed");

    const suggestion = JSON.parse(result.outputText);

    assert.deepEqual(suggestion, {
        categoryName: "Payment",
        priority: "HIGH",
    });
});

test("mock provider stops reply streaming when cancelled", async () => {
    const controller = new AbortController();
    controller.abort();

    const events = await mockAiProvider.streamReply(
        JSON.stringify({ title: "Test ticket" }),
        controller.signal
    );

    const received: unknown[] = [];

    for await (const event of events) {
        received.push(event);
    }

    assert.equal(received.length, 0);
});
