import { Composition } from "remotion";
import { SLOW, STORY_FRAMES, Trailer } from "./Trailer";
import "./fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition id="Trailer" component={Trailer} durationInFrames={Math.ceil(STORY_FRAMES * SLOW * 4)} fps={120} width={1920} height={1080} />
  );
};
