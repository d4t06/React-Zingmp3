import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  PauseCircleIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { memo, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectAllPlayStatusStore } from "../../store/PlayStatusSlice";
import { selectAllSongStore } from "../../store";

type Props = {
  handlePlayPause: () => void;
};
function PlayPauseButton({ handlePlayPause }: Props) {
  const {
    playStatus: { isError, isPlaying, isWaiting },
  } = useSelector(selectAllPlayStatusStore);
  const { song: songInStore } = useSelector(selectAllSongStore);

  const renderIcon = useMemo(() => {
    if (isWaiting) {
      return <ArrowPathIcon className={"w-[36px] max-[549px]:w-[46px] animate-spin"} />;
    } else if (isError && songInStore.name) {
      return <ExclamationCircleIcon className="w-[30px] max-[549px]:w-[40px]" />;
    }

    return isPlaying ? (
      <PauseCircleIcon className={"w-[50px] max-[549px]:w-[60px]"} />
    ) : (
      <PlayCircleIcon className={"w-[50px] max-[549px]:w-[60px]"} />
    );
  }, [isWaiting, isError, isPlaying, songInStore]);

  return (
    <>
      <button
        className={`p-[5px] ${
          isWaiting && "pointer-events-none"
        } inline-flex items-center justify-center w-[50px] max-[549px]:w-[60px]`}
        onClick={() => handlePlayPause()}
      >
        {renderIcon}
      </button>
    </>
  );
}

export default memo(PlayPauseButton);
