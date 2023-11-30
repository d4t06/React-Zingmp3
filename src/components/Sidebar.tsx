import { HomeIcon, MusicalNoteIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { routes } from "../routes";
import { Button, Skeleton } from "../components";
import { auth } from "../config/firebase";
import { useTheme, useAuthStore } from "../store";

export default function Sidebar() {
   // use store
   const { theme } = useTheme();
   const { userInfo } = useAuthStore();
   const [loggedInUser] = useAuthState(auth);

   const location = useLocation();

   // define skeleton
   const menuItemSkeletons = [...Array(2).keys()].map((index) => {
      return (
         <div key={index} className="pl-[14px] h-[44px] flex items-center">
            <Skeleton className="w-[25px] h-[25px] flex-shrink-0" />
            <Skeleton className="w-[80px] h-[19px] ml-[5px]" />
         </div>
      );
   });

   //  define styles
   const classes = {
      container: `w-[180px] h-full flex-shrink-0 border-r-[1px] h-screen ${theme.side_bar_bg} border-${theme.alpha}`,
      button: `w-full text-[14px] font-[500] ${theme.content_hover_text}`,
      text: theme.type === "light" ? "text-[#333]" : "text-white",
      icon: "w-[25px] mr-[5px]",
      menuItem: "w-full border-l-[4px] pl-[10px] h-[44px] inline-flex items-center",
      activeMenu: `${theme.content_text} ${theme.container} ${theme.content_border}`,
   };

   return (
      <div className={`${classes.container} ${classes.text}`}>
         <div className="px-[10px] h-[60px] flex items-center">
            <h1 className="text-[24px] font-semibold">
               HD
               <span className={`${theme.content_text} ml-[4px]`}>MP3</span>
            </h1>
         </div>

         <div className="flex flex-col items-start">
            {userInfo.status === "loading" && menuItemSkeletons}

            {userInfo.status !== "loading" && (
               <>
                  <Link
                     className={`${classes.menuItem} ${
                        location.pathname === "/" ? classes.activeMenu : "border-transparent"
                     }`}
                     to={routes.Home}
                  >
                     <Button className={classes.button}>
                        <HomeIcon className={classes.icon} />
                        Discover
                     </Button>
                  </Link>
                  {loggedInUser?.email && (
                     <Link
                        className={`${classes.menuItem}  ${
                           location.pathname.includes("mysongs")
                              ? classes.activeMenu
                              : "border-transparent"
                        }`}
                        to={routes.MySongs}
                     >
                        <Button className={classes.button}>
                           <MusicalNoteIcon className={classes.icon} />
                           My Song
                        </Button>
                     </Link>
                  )}
                  {userInfo.role === "admin" && (
                     <Link
                        className={`${classes.menuItem} border-transparent`}
                        to={routes.Dashboard}
                     >
                        <Button className={classes.button}>
                           <ComputerDesktopIcon className={classes.icon} />
                           Dashboard
                        </Button>
                     </Link>
                  )}
               </>
            )}
         </div>
      </div>
   );
}
