const { invoke } = window.__TAURI__.core;
const { convertFileSrc } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;
const { emit } = window.__TAURI__.event;

import { editToggle, transitionToggle } from "./script.js";
import { layout } from "./ui_action_grid.js";
import {
  displayDeselectAll,
  displaySelect,
  unmarkPlayingAll,
  markPlaying,
  displaySelectMedia,
  playingElement,
} from "./ui_grid_logic.js";

let selectedIndex = 0;

function nextElementLeft() {
  const newIndex = selectedIndex - 1;
  const newElement = document.getElementById(layout[newIndex]);
  newElement.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest"
  });
  return newElement;
}

export function keyLeftArrow() {
  if (editToggle) {
    return;
  }

  const selectedElement = document.querySelector(".displaySelected");
  if (!selectedElement) {
    selectedIndex = 0;
  } else {
    selectedIndex = layout.indexOf(selectedElement.parentElement.id);
  }

  let result = false;
  for (let i = selectedIndex - 1; i >= 0; i--) {
    const newElement = nextElementLeft();
    if (!newElement.empty) {
      result = true;
      break;
    }
    selectedIndex -= 1;
  }

  if (!result) {
    selectedIndex = 1;
  }

  const newIndex = selectedIndex - 1;
  const newElement = document.getElementById(layout[newIndex]);
  displaySelectMedia(newElement);
}

function nextElementRight() {
  const newIndex = selectedIndex + 1;
  const newElement = document.getElementById(layout[newIndex]);
  newElement.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest"
  });
  return newElement;
}

export function keyRightArrow() {
  if (editToggle) {
    return;
  }

  const selectedElement = document.querySelector(".displaySelected");
  if (!selectedElement) {
    selectedIndex = 0;
  } else {
    selectedIndex = layout.indexOf(selectedElement.parentElement.id);
  }

  let result = false;
  for (let i = selectedIndex + 1; i < layout.length; i++) {
    const newElement = nextElementRight();
    if (!newElement.empty) {
      result = true;
      break;
    }
    selectedIndex += 1;
  }

  if (!result) {
    selectedIndex = -1;
  }

  const newIndex = selectedIndex + 1;
  const newElement = document.getElementById(layout[newIndex]);
  displaySelectMedia(newElement);
}

export function keyEnter() {
  if (editToggle) {
    return;
  }

  const selected = document.querySelector(".displaySelected");

  playingElement(selected);
}
