import { ForwardedRef   , forwardRef } from "react";
import { Song, ThemeType } from "../types";
import Button from "./ui/Button";
import { PauseCircleIcon } from "@heroicons/react/24/outline";
import playingIcon from '../assets/icon-playing.gif'
// import Image from "./ui/Image";

interface Props {
   data?: Song;
   active: boolean;
   onClick?: () => void;
   hasHover?: boolean;
   hasTitle?: boolean;
   classNames?: string;
   idleClass?: string
   theme: ThemeType
}

const SongThumbnail = ({
   data,
   active,
   hasHover,
   onClick,
   hasTitle,
   classNames,
   theme,
   idleClass
} : Props, ref : ForwardedRef<any>) => {

   const classes = {
      container: "flex flex-col min-[549px]:px-[20px]",
      imageFrame: "group relative transition-[width] duration-300 origin-center rounded-[6px] overflow-hidden",
      image: "select-none object-cover object-center rounded w-full",
      overlay:
         "absolute inset-0 bg-[#333] bg-opacity-60 items-center justify-center hidden max-[549px]:hidden group-hover:flex",
      playingGifFrame: "absolute h-[30px] w-[30px] bottom-[15px] left-[15px]",
      title: "text-2xl text-white  text-center mt-[10px] font-bold max-[549px]:text-xl text-ellipsis line-clamp-1",
   };

   const classWhenActive = `${
      active ? "w-[320px] max-[549px]:w-[100%]" : "w-[280px] max-[549px]:w-[75%]"
   }`;


   if (!data) return;

   return (
      <div ref={ref} className={`${classes.container} ${idleClass && idleClass}`}>
         <div className={`flex ${classNames && classNames}`}>
            <div className={`${classes.imageFrame} ${classWhenActive}`}>

               {/* <Image classNames="rounded-[6px]" src={data.image_url} /> */}

               <img src={data.image_url || "https://placehold.co/100"} className="w-full" alt="" />

               {hasHover && !active && (
                  <div className={classes.overlay}>
                     <Button
                        onClick={onClick}
                        variant={"circle"}
                        className={`h-[50px] w-[50px] text-white ${theme.content_hover_text}`}
                     >
                        <PauseCircleIcon />
                     </Button>
                  </div>
               )}

               {/* playing gif */}
               {active && window.innerWidth >= 550 && (
                  <div className={classes.playingGifFrame}>
                     <img
                        src={playingIcon}
                        alt=""
                     />
                  </div>
               )}
            </div>
         </div>

         {hasTitle && (
            <div>
               <h2 className={classes.title}>{data?.name || "Some song"}</h2>
               <p className="text-center text-md  text-gray-500 line-clamp-1">
                  {data?.singer || "..."}
               </p>
            </div>
         )}
      </div>
   );
};

export default forwardRef(SongThumbnail);
