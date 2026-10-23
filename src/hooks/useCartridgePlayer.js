import { useReducer } from "react";

export const initialPlayer = {
  phase: "idle",
  activeIndex: null,
  nextIndex: null,
  selectedIndex: 2,
};
export const busyPhases = new Set([
  "approaching",
  "inserting",
  "zooming",
  "zoomingOut",
  "ejecting",
  "returning",
]);

// Animasyon tamamlanma olayları akışı ilerletir; zamanlayıcılar birbiriyle yarışmaz.
export function playerReducer(state, action) {
  if (action.type === "select") {
    if (busyPhases.has(state.phase)) return state;
    if (state.phase === "reading") {
      if (state.activeIndex === action.index) return state;
      return { ...state, phase: "zoomingOut", nextIndex: action.index };
    }
    return {
      ...state,
      phase: "approaching",
      activeIndex: action.index,
      selectedIndex: action.index,
    };
  }
  if (action.type === "close" && state.phase === "reading") {
    return { ...state, phase: "zoomingOut", nextIndex: null };
  }
  if (action.type !== "advance" || action.phase !== state.phase) return state;
  switch (state.phase) {
    case "approaching":
      return { ...state, phase: "inserting" };
    case "inserting":
      return { ...state, phase: "zooming" };
    case "zooming":
      return { ...state, phase: "reading" };
    case "zoomingOut":
      return { ...state, phase: "ejecting" };
    case "ejecting":
      return { ...state, phase: "returning" };
    case "returning":
      return state.nextIndex === null
        ? { ...state, phase: "idle", activeIndex: null }
        : {
            phase: "approaching",
            activeIndex: state.nextIndex,
            selectedIndex: state.nextIndex,
            nextIndex: null,
          };
    default:
      return state;
  }
}

export default function useCartridgePlayer() {
  const [player, dispatch] = useReducer(playerReducer, initialPlayer);
  return {
    ...player,
    busy: busyPhases.has(player.phase),
    select: (index) => dispatch({ type: "select", index }),
    close: () => dispatch({ type: "close" }),
    advance: (phase) => dispatch({ type: "advance", phase }),
  };
}
