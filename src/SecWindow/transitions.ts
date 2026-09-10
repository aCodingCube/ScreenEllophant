//* audio Setup
const audioCtx: AudioContext = new AudioContext();
const audioSources: MediaElementAudioSourceNode[] = [];
const gainNodes = [audioCtx.createGain(), audioCtx.createGain()];
gainNodes[0].connect(audioCtx.destination);
gainNodes[1].connect(audioCtx.destination);
let audioSrcCounter: number = 0;

//* other variables
let blackoutToggle: boolean = false;

export function preloadSlot(isVideo: boolean, url: string, isLooped: boolean, isColor: boolean): void {
    const preloadSlot = document.querySelector(".preload");
    if (!preloadSlot) {
        console.error("No preload slot found! transitions.ts");
        return;
    }

    preloadSlot.innerHTML = "";

    if (isVideo) {
        const bg = document.createElement("div");
        bg.style.backgroundColor = "black";
        bg.style.width = "100%";
        bg.style.height = "100%";

        const video = document.createElement("video");
        video.src = url;
        video.muted = true;
        video.preload = "auto";
        video.loop = isLooped;
        video.crossOrigin = "anonymous";
        video.dataset.counter = audioSrcCounter.toString(); // ts typesafe alternative to video.counter ! type = String !

        // audio setup
        audioSources[audioSrcCounter] = audioCtx.createMediaElementSource(video);
        audioSources[audioSrcCounter].connect(gainNodes[audioSrcCounter]);
        audioSrcCounter = audioSrcCounter == 0 ? 1 : 0;

        bg.appendChild(video);
        preloadSlot.appendChild(bg);
        return;
    }

    if (isColor) {
        const div = document.createElement("div");
        div.style.backgroundColor = url;
        div.style.width = "100%";
        div.style.height = "100%";

        preloadSlot.appendChild(div);
        console.log(`preloaded Color -> ${url}`);
        return;
    }

    /* is img */
    const bg = document.createElement("div");
    bg.style.backgroundColor = "black";
    bg.style.width = "100%";
    bg.style.height = "100%";

    const img = document.createElement("img");
    img.src = url;

    bg.appendChild(img);
    preloadSlot.appendChild(bg);

    return;
}

export function mainTransition(transitionDuration: number, isLooped: boolean): void {

    // main transition
    const newSlot = document.querySelector(".preload");
    const oldSlot = document.querySelector(".visible");

    document.documentElement.style.setProperty('--fade-duration', `${transitionDuration}ms`);

    if (!newSlot || !oldSlot) {
        console.error("!newSlot || !oldSlot -> transitions.ts");
        return;
    }

    if (blackoutToggle) {
        blackoutToggle = false;

        oldSlot.classList.remove("visible");
        oldSlot.classList.add("preload");
        newSlot.classList.remove("preload");
        newSlot.classList.add("visible");

        removeBlackout(transitionDuration);

        return;
    }

    // new preload slot
    const newPreloadSlot = document.querySelector(".hidden");
    newPreloadSlot?.classList.remove("hidden");
    newPreloadSlot?.classList.add("preload");

    oldSlot.classList.add("hidden");
    oldSlot.classList.remove("visible");
    newSlot.classList.remove("preload");
    newSlot.classList.add("visible");

    //* old video fade audio out
    if (oldSlot.firstElementChild?.firstElementChild?.tagName == "VIDEO") {
        const video = oldSlot.firstElementChild.firstElementChild;
        if (!(video instanceof HTMLVideoElement)) {
            return;
        }

        const fadeSeconds = Number((transitionDuration / 1000).toFixed(2));
        const currentTime: number = audioCtx.currentTime;
        if (fadeSeconds > 0) {
            gainNodes[Number(video.dataset.counter)].gain.setValueAtTime(1, currentTime);
            gainNodes[Number(video.dataset.counter)].gain.linearRampToValueAtTime(0, currentTime + fadeSeconds);
            setTimeout(() => {
                audioSources[Number(video.dataset.counter)].disconnect();
            }, transitionDuration);
        }
        else if (fadeSeconds == 0) {
            gainNodes[Number(video.dataset.counter)].gain.setValueAtTime(0, currentTime);
            audioSources[Number(video.dataset.counter)].disconnect();
        }
    }

    if (newSlot.firstElementChild?.firstElementChild?.tagName == "VIDEO") { // if video unmute and play video
        const video = newSlot.firstElementChild.firstElementChild;
        if (!(video instanceof HTMLVideoElement)) {
            return;
        }

        //* video setup new video
        const currentTime: number = audioCtx.currentTime;
        gainNodes[Number(video.dataset.counter)].gain.setValueAtTime(1, currentTime);

        video.play();
        video.muted = false;
        video.loop = isLooped;
    }
}

export function secTransition(): void {

}

export function blackoutTransition(transition: 0 | 1): void {
    const slot = document.querySelector("#blackoutSlot");

    if (!slot) {
        console.error("no blackout slot! transitions.ts");
        return;
    }

    if (blackoutToggle) {
        document.documentElement.style.setProperty('--blackout-fade', `${transition * 1000}ms`);
        slot.classList.remove("blackoutVisible");
        blackoutToggle = false;
        return;
    }

    document.documentElement.style.setProperty('--blackout-fade', `${transition * 1000}ms`);
    slot.classList.add("blackoutVisible");
    blackoutToggle = true;
}

function removeBlackout(transitionDuration: number): void {
    const slot = document.querySelector("#blackoutSlot");

    document.documentElement.style.setProperty('--blackout-fade', `${transitionDuration}ms`);
    slot?.classList.remove("blackoutVisible");
    blackoutToggle = false;
}