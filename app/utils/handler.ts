import { KeyboardEvent } from "hono/jsx";

export const handleEnter = (callback: (event: KeyboardEvent) => void) => {
  return (event: KeyboardEvent) => {
    if (event.key === "Enter" && typeof callback === "function") {
      callback(event);
    }
  };
};
