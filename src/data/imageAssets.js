// Optimized, responsive WebP assets. Large covers are only used by the reader.
import asset0 from "../assets/optimized/roomLandscape-scene-768.webp";
import asset1 from "../assets/optimized/roomLandscape-scene-1280.webp";
import asset2 from "../assets/optimized/roomLandscape-scene-1672.webp";
import asset3 from "../assets/optimized/roomPortrait-scene-480.webp";
import asset4 from "../assets/optimized/roomPortrait-scene-768.webp";
import asset5 from "../assets/optimized/roomPortrait-scene-941.webp";
import asset6 from "../assets/optimized/bmo-character-360.webp";
import asset7 from "../assets/optimized/bmo-character-720.webp";
import asset8 from "../assets/optimized/bmo-character-1149.webp";
import asset9 from "../assets/optimized/technology-card-192.webp";
import asset10 from "../assets/optimized/technology-card-384.webp";
import asset11 from "../assets/optimized/technology-card-576.webp";
import asset12 from "../assets/optimized/technology-article-640.webp";
import asset13 from "../assets/optimized/technology-article-960.webp";
import asset14 from "../assets/optimized/technology-article-1280.webp";
import asset15 from "../assets/optimized/technology-article-1672.webp";
import asset16 from "../assets/optimized/economy-card-192.webp";
import asset17 from "../assets/optimized/economy-card-384.webp";
import asset18 from "../assets/optimized/economy-card-576.webp";
import asset19 from "../assets/optimized/economy-article-640.webp";
import asset20 from "../assets/optimized/economy-article-960.webp";
import asset21 from "../assets/optimized/economy-article-1280.webp";
import asset22 from "../assets/optimized/economy-article-1672.webp";
import asset23 from "../assets/optimized/politics-card-192.webp";
import asset24 from "../assets/optimized/politics-card-384.webp";
import asset25 from "../assets/optimized/politics-card-576.webp";
import asset26 from "../assets/optimized/politics-article-640.webp";
import asset27 from "../assets/optimized/politics-article-960.webp";
import asset28 from "../assets/optimized/politics-article-1280.webp";
import asset29 from "../assets/optimized/politics-article-1672.webp";
import asset30 from "../assets/optimized/weather-card-192.webp";
import asset31 from "../assets/optimized/weather-card-384.webp";
import asset32 from "../assets/optimized/weather-card-576.webp";
import asset33 from "../assets/optimized/weather-article-640.webp";
import asset34 from "../assets/optimized/weather-article-960.webp";
import asset35 from "../assets/optimized/weather-article-1280.webp";
import asset36 from "../assets/optimized/weather-article-1672.webp";
import asset37 from "../assets/optimized/culture-card-192.webp";
import asset38 from "../assets/optimized/culture-card-384.webp";
import asset39 from "../assets/optimized/culture-card-576.webp";
import asset40 from "../assets/optimized/culture-article-640.webp";
import asset41 from "../assets/optimized/culture-article-960.webp";
import asset42 from "../assets/optimized/culture-article-1280.webp";
import asset43 from "../assets/optimized/culture-article-1672.webp";

function makeSet(variants, fallbackWidth) {
  const fallback = variants.find((image) => image.width === fallbackWidth);
  return {
    ...fallback,
    srcSet: variants
      .map((image) => image.src + " " + image.width + "w")
      .join(", "),
  };
}

export const sceneImages = {
  roomLandscape: makeSet(
    [
      { src: asset0, width: 768, height: 432 },
      { src: asset1, width: 1280, height: 720 },
      { src: asset2, width: 1672, height: 941 },
    ],
    1280,
  ),
  roomPortrait: makeSet(
    [
      { src: asset3, width: 480, height: 853 },
      { src: asset4, width: 768, height: 1365 },
      { src: asset5, width: 941, height: 1672 },
    ],
    768,
  ),
  bmo: makeSet(
    [
      { src: asset6, width: 360, height: 429 },
      { src: asset7, width: 720, height: 858 },
      { src: asset8, width: 1149, height: 1369 },
    ],
    720,
  ),
};

export const coverImages = {
  technology: {
    card: makeSet(
      [
        { src: asset9, width: 192, height: 108 },
        { src: asset10, width: 384, height: 216 },
        { src: asset11, width: 576, height: 324 },
      ],
      384,
    ),
    article: makeSet(
      [
        { src: asset12, width: 640, height: 360 },
        { src: asset13, width: 960, height: 540 },
        { src: asset14, width: 1280, height: 720 },
        { src: asset15, width: 1672, height: 941 },
      ],
      1280,
    ),
  },
  economy: {
    card: makeSet(
      [
        { src: asset16, width: 192, height: 108 },
        { src: asset17, width: 384, height: 216 },
        { src: asset18, width: 576, height: 324 },
      ],
      384,
    ),
    article: makeSet(
      [
        { src: asset19, width: 640, height: 360 },
        { src: asset20, width: 960, height: 540 },
        { src: asset21, width: 1280, height: 720 },
        { src: asset22, width: 1672, height: 941 },
      ],
      1280,
    ),
  },
  politics: {
    card: makeSet(
      [
        { src: asset23, width: 192, height: 108 },
        { src: asset24, width: 384, height: 216 },
        { src: asset25, width: 576, height: 324 },
      ],
      384,
    ),
    article: makeSet(
      [
        { src: asset26, width: 640, height: 360 },
        { src: asset27, width: 960, height: 540 },
        { src: asset28, width: 1280, height: 720 },
        { src: asset29, width: 1672, height: 941 },
      ],
      1280,
    ),
  },
  weather: {
    card: makeSet(
      [
        { src: asset30, width: 192, height: 108 },
        { src: asset31, width: 384, height: 216 },
        { src: asset32, width: 576, height: 324 },
      ],
      384,
    ),
    article: makeSet(
      [
        { src: asset33, width: 640, height: 360 },
        { src: asset34, width: 960, height: 540 },
        { src: asset35, width: 1280, height: 720 },
        { src: asset36, width: 1672, height: 941 },
      ],
      1280,
    ),
  },
  culture: {
    card: makeSet(
      [
        { src: asset37, width: 192, height: 108 },
        { src: asset38, width: 384, height: 216 },
        { src: asset39, width: 576, height: 324 },
      ],
      384,
    ),
    article: makeSet(
      [
        { src: asset40, width: 640, height: 360 },
        { src: asset41, width: 960, height: 540 },
        { src: asset42, width: 1280, height: 720 },
        { src: asset43, width: 1672, height: 941 },
      ],
      1280,
    ),
  },
};
