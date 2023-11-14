import { PauseCircleIcon } from "@heroicons/react/24/outline";
import { FC, useMemo } from "react";

import { Playlist, ThemeType } from "../types";

import Button from "./ui/Button";
import { Link } from "react-router-dom";
import Image from "./ui/Image";
import playingIcon from "../assets/icon-playing.gif";

interface Props {
  data: Playlist;
  theme?: ThemeType & { alpha: string };
  inDetail?: boolean;
  active?: boolean;
  onClick?: () => void;
  admin?: boolean;
}

const PlaylistItem: FC<Props> = ({ data, inDetail, theme, active, admin }) => {
  const classes = {
    button: `rounded-full text-[#fff] p-[4px] hover:bg-${theme?.alpha}`,
    imageContainer: `absolute inset-0 overflow-hidden rounded-[6px]`,
    absoluteContainer: "absolute inset-0 group-hover:block",
    overlay: "absolute inset-0 bg-[#000] opacity-[.5]",
    buttonContainer: "justify-center items-center h-full relative z-10 relative",
    buttonWrapper: "flex items-center justify-center z-10 h-full w-full relative",
  };
  const isOnMobile = useMemo(() => {
    return window.innerWidth < 800;
  }, []);

  return (
    <>
      <Link
        to={admin ? `/dashboard/playlist/${data.id}` : `/playlist/${data.id}`}
        className="group relative pt-[100%] w-full block"
      >
        <div className={classes.imageContainer}>
          <Image
            classNames="group-hover:scale-[1.05] transition duration-[.3s]"
            src={data.image_url}
            blurHashEncode={data.blurhash_encode}
          />

          {!isOnMobile && !inDetail && (
            <div
              className={`${classes.absoluteContainer} ${
                active && !inDetail ? "block" : "hidden"
              }`}
            >
              <div className={classes.overlay}></div>

              {active && (
                <div className={classes.buttonWrapper}>
                  <img src={playingIcon} alt="" className="w-[30px]" />
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
      {!inDetail && (
        <h5 className="text-[18px] line-clamp-1 leading-[22px] font-[500] mt-[6px]">
          {data.name}
        </h5>
      )}
    </>
  );
};

export default PlaylistItem;
