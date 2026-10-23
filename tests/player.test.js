import test from "node:test";
import assert from "node:assert/strict";
import {
  initialPlayer,
  playerReducer,
} from "../src/hooks/useCartridgePlayer.js";
import { getSoundSequence, soundProfiles } from "../src/data/sounds.js";

function finish(state) {
  return playerReducer(state, { type: "advance", phase: state.phase });
}

test("insertion goes directly to the screen without a loading or celebration hold", () => {
  let state = playerReducer(initialPlayer, { type: "select", index: 0 });
  assert.equal(state.phase, "approaching");
  for (const expected of ["inserting", "zooming", "reading"]) {
    state = finish(state);
    assert.equal(state.phase, expected);
  }
  assert.equal(state.activeIndex, 0);
});

test("rapid selection and stale animation callbacks cannot interrupt a cartridge", () => {
  const state = playerReducer(initialPlayer, { type: "select", index: 0 });
  assert.equal(playerReducer(state, { type: "select", index: 4 }), state);
  assert.equal(
    playerReducer(state, { type: "advance", phase: "returning" }),
    state,
  );
  assert.equal(playerReducer(state, { type: "close" }), state);
});

test("switching returns the old cartridge before approaching with the next one", () => {
  let state = {
    ...initialPlayer,
    phase: "reading",
    activeIndex: 0,
    selectedIndex: 0,
  };
  assert.equal(playerReducer(state, { type: "select", index: 0 }), state);
  state = playerReducer(state, { type: "select", index: 4 });
  assert.equal(state.phase, "zoomingOut");
  assert.equal(state.activeIndex, 0);
  state = finish(state);
  assert.equal(state.phase, "ejecting");
  state = finish(state);
  assert.equal(state.phase, "returning");
  assert.equal(state.activeIndex, 0);
  state = finish(state);
  assert.equal(state.phase, "approaching");
  assert.equal(state.activeIndex, 4);
  assert.equal(state.nextIndex, null);
});

test("closing ejects and restores the collection without inserting another card", () => {
  let state = {
    ...initialPlayer,
    phase: "reading",
    activeIndex: 3,
    selectedIndex: 3,
  };
  state = playerReducer(state, { type: "close" });
  assert.equal(state.phase, "zoomingOut");
  state = finish(state);
  assert.equal(state.phase, "ejecting");
  state = finish(finish(state));
  assert.equal(state.phase, "idle");
  assert.equal(state.activeIndex, null);
  assert.equal(state.selectedIndex, 3);
});

test("five categories have distinct, bounded melodies and separate transition sounds", () => {
  const signatures = new Set();
  for (const id of Object.keys(soundProfiles)) {
    const hover = getSoundSequence(id);
    signatures.add(JSON.stringify(hover));
    assert.notDeepEqual(getSoundSequence(id, "insert"), hover);
    assert.notDeepEqual(getSoundSequence(id, "eject"), hover);
    for (const event of ["hover", "select", "insert", "eject"]) {
      for (const tone of getSoundSequence(id, event)) {
        assert.ok(tone.frequency > 0 && tone.volume <= 0.1);
        assert.ok(tone.length > 0.006 && tone.start + tone.length < 0.5);
      }
    }
  }
  assert.equal(signatures.size, 5);
  assert.deepEqual(getSoundSequence("unknown"), getSoundSequence("technology"));
});

test("late screen animation events and clicks cannot skip the zoom-out before ejection", () => {
  let state = {
    ...initialPlayer,
    phase: "reading",
    activeIndex: 1,
    selectedIndex: 1,
  };
  state = playerReducer(state, { type: "close" });
  assert.equal(state.phase, "zoomingOut");
  assert.equal(
    playerReducer(state, { type: "advance", phase: "zooming" }),
    state,
  );
  assert.equal(playerReducer(state, { type: "select", index: 4 }), state);
  assert.equal(finish(state).phase, "ejecting");
});

test("robot cheers use rising syllables within a short, bounded envelope", () => {
  for (const category of Object.keys(soundProfiles)) {
    const cheer = getSoundSequence(category, "cheer");
    assert.notDeepEqual(cheer, getSoundSequence(category));
    for (const note of cheer) {
      assert.ok(note.endFrequency > note.frequency);
      assert.ok(note.start + note.length < 0.9);
      assert.ok(note.volume <= 0.1);
    }
  }
});
