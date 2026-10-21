import { Composition } from "remotion";
import { Trailer } from "./Trailer";
import "./fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition id="Trailer" component={Trailer} durationInFrames={24 * 30} fps={30} width={1920} height={1080} />
  );
};
