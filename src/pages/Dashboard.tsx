import { useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useTheme } from "../store/ThemeContext";

import { PlusCircleIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Song, User } from "../types";
import { db } from "../config/firebase";
import { useLocation, useNavigate } from "react-router-dom";
import { routes } from "../routes";

import {
   Button,
   Image,
   Modal,
   DashboardSongItem,
   ConfirmModal,
   AddPlaylist,
   PlaylistItem,
   Empty,
   SongItem,
   SongList,
} from "../components";

import { convertTimestampToString } from "../utils/appHelpers";
import { deleteSong, myGetDoc } from "../utils/firebaseHelpers";
import { useAuthStore, useSongsStore } from "../store";
import useSong from "../hooks/useSongs";
import useUploadSongs from "../hooks/useUploadSongs";
import Skeleton, { PlaylistSkeleton } from "../components/skeleton";

// 2 time render


// manual run init
export default function DashBoard() {
   // use store
   const { theme } = useTheme();
   const { userInfo } = useAuthStore();
   const {
      loading: initialLoading,
      initSongsAndPlaylists,
      initial,
   } = useSong({ admin: true });
   const { adminPlaylists, adminSongs, setAdminSongs } =
      useSongsStore();

   // state
   const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
   const [isChecked, setIsChecked] = useState(false);

   const [users, setUsers] = useState<User[]>([]);
   const [isOpenModal, setIsOpenModal] = useState(false);
   const [loading, setLoading] = useState(false);
   const [errorMsg, setErrorMsg] = useState<string>("");
   const [selectedList, setSelectedList] = useState<Song[]>([]);
   const [modalName, setModalName] = useState<"confirm" | "addPlaylist">();
   const [tab, setTab] = useState<"adminSongs" | "users">("adminSongs");

   const audioRef = useRef<HTMLAudioElement>(null);
   const selectAllBtnRef = useRef<HTMLInputElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);
   const firstTempSong = useRef<HTMLDivElement>(null);
   const testImageRef = useRef<HTMLImageElement>(null);
   const firstTimeRun = useRef(true);

   // use hooks
   const navigate = useNavigate();
   const location = useLocation()
   const { addedSongIds, handleInputChange, status, tempSongs } = useUploadSongs({
      audioRef,
      admin: true,
      firstTempSong,
      testImageRef,
      inputRef,
   });

   const songCount = useMemo(() => {
      if (loading) return 0;
      return tempSongs.length + adminSongs.length;
   }, [tempSongs, adminSongs]);

   const getUsers = async () => {
      console.log(">>> api: get user");

      try {
         setLoading(true);
         const queryGetUsers = query(
            collection(db, "users"),
            where("email", "!=", userInfo?.email as string)
         );
         const usersSnapshot = await getDocs(queryGetUsers);

         if (usersSnapshot.docs) {
            const usersList = usersSnapshot.docs.map((doc) => doc.data() as User);

            console.log("get user", usersList);

            setUsers(usersList);
         }
      } catch (error) {
         console.log(error);
         setErrorMsg("get users list error");
      } finally {
         setLoading(false);
      }
   };

   const handleSelectAll = () =>
      selectedList.length ? setSelectedList([]) : setSelectedList(adminSongs);

   const handleDeleteSongs = async () => {
      try {
         const newAdminSongs = [...adminSongs];
         setLoading(true);
         for (let song of selectedList) {
            await deleteSong(song);

            const index = adminSongs.findIndex((item) => item.id === song.id);
            newAdminSongs.splice(index, 1);
         }
         setLoading(false);
         setAdminSongs(newAdminSongs);
      } catch (error) {
         console.log({ message: error });
      }
   };

   const handleOpenModal = (name: "confirm" | "addPlaylist") => {
      setModalName(name);
      setIsOpenModal(true);
   };

   const renderTempSongsList = () => {
      return tempSongs.map((song, index) => {
         const isAdded = addedSongIds.some((id) => {
            let condition = id === song.id;
            return condition;
         });

         if (index == 0) {
            return (
               <SongItem
                  admin
                  theme={theme}
                  inProcess={!isAdded}
                  data={song}
                  key={index}
               />
            );
         }

         return (
            <SongItem admin theme={theme} inProcess={!isAdded} data={song} key={index} />
         );
      });
   };

   const renderUsersList = () => {
      return users.map((user, index) => {
         return (
            <tr className={``} key={index}>
               <td className={classes.td}>
                  <div className="h-[44px] w-[44px] ml-[20px]">
                     <Image classNames="rounded-[4px]" src={user.photoURL} />
                  </div>
               </td>
               <td className={classes.td}>{user.display_name}</td>
               <td className={classes.td}>{user.email}</td>
               <td className={classes.td}>
                  {convertTimestampToString(user?.latest_seen)}
               </td>
            </tr>
         );
      });
   };


  //  run auth
   useEffect(() => {
     if (userInfo.status === "loading") {
       setLoading(false);
       return;
     }

     const auth = async () => {
       try {
         const userSnapshot = await myGetDoc({
           collection: "users",
           id: userInfo?.email as string,
           msg: ">>> api: get auth info",
         });
         const userData = userSnapshot.data() as User;
         if (userData.role !== "admin") return navigate(routes.Home);

         if (!initial) initSongsAndPlaylists();
         else setTimeout(() => setLoading(false), 200);
       } catch (error) {
         console.log(error);
       }
     };

     if (!userInfo.email) return navigate(routes.Home);

     if (firstTimeRun.current) {
       firstTimeRun.current = false;

       // case already run auth
       if (userInfo.role === "admin") return;
       else auth();
     }
   }, [userInfo.status]);

   useEffect(() => {
      if (userInfo.status === "loading") return;

      if (tab === "users" && !users.length) {
         getUsers();
      }
   }, [tab]);

   const classes = {
      button: `${theme.content_bg} rounded-full`,
      inActiveBtn: `bg-${theme.alpha}`,
      activeBtn: `${theme.content_bg}`,
      td: `py-[10px] my-[10px] border-${theme.alpha} border-b-[1px]`,
      th: `py-[5px]`,
      tableContainer: `border border-${theme.alpha} rounded-[4px]`,
      tableHeader: `border-b border-${theme.alpha} ${theme.side_bar_bg} flex items-center h-[50px] gap-[15px]`,
   };

   if (userInfo.status === "loading") {
      return;
   }

   return (
      <>
         <input
            onChange={handleInputChange}
            type="file"
            multiple
            accept=".mp3"
            id="file"
            className="hidden"
            ref={inputRef}
         />
         <img ref={testImageRef} className="hidden" />
         <audio ref={audioRef} className="hidden" />

         <div className={`container mx-auto pb-[60px]`}>
            {/* tabs */}
            <div className="mb-[20px]">
               <Button
                  onClick={() => setTab("adminSongs")}
                  className={`${
                     tab === "adminSongs" ? classes.activeBtn : classes.inActiveBtn
                  }  rounded-full`}
                  variant={"primary"}
               >
                  Songs
               </Button>
               <Button
                  onClick={() => setTab("users")}
                  className={` ${
                     tab === "users" ? classes.activeBtn : classes.inActiveBtn
                  } rounded-full ml-[10px]`}
                  variant={"primary"}
               >
                  Users
               </Button>
            </div>

            {/* content */}
            <div className="mt-[30px]">
               {tab === "adminSongs" && (
                  <>
                     {/* playlist */}
                     <h3 className="text-2xl font-bold mb-[10px]">Playlist</h3>

                     <div className="flex flex-row flex-wrap mb-[30px] -mx-[8px]">
                        {!initialLoading &&
                           !!adminPlaylists.length &&
                           adminPlaylists.map((playList, index) => (
                              <div
                                 key={index}
                                 className="w-1/4 p-[8px] max-[549px]:w-1/2"
                              >
                                 <PlaylistItem admin theme={theme} data={playList} />
                              </div>
                           ))}

                        {initialLoading && PlaylistSkeleton}

                        <div className="w-1/4 p-[8px] max-[549px]:w-1/2">
                           <Empty
                              theme={theme}
                              className="pt-[100%]"
                              onClick={() => handleOpenModal("addPlaylist")}
                           />
                        </div>
                     </div>

                     {/* adminSongs */}

                     <div className="flex justify-between mb-[10px]">
                        <h3 className="text-2xl font-bold">Songs</h3>
                        {/* for upload song */}
                        <input
                           ref={inputRef}
                           onChange={handleInputChange}
                           type="file"
                           multiple
                           accept=".mp3"
                           id="file"
                           className="hidden"
                        />
                        <audio ref={audioRef} className="hidden" />
                        <div className="flex items-center">
                           <label
                              className={`${theme.content_bg} ${
                                 status === "uploading" || initialLoading
                                    ? "opacity-60 pointer-events-none"
                                    : ""
                              } rounded-full flex px-[20px] py-[4px] cursor-pointer`}
                              htmlFor="file"
                           >
                              <PlusCircleIcon className="w-[20px] mr-[5px]" />
                              Upload
                           </label>
                        </div>
                     </div>

                     <div
                        className={`flex gap-[12px] items-center border-b border-${theme.alpha} h-[60px]`}
                     >
                        {initialLoading && <Skeleton className="h-[20px] w-[150px]" />}

                        {/* checked song */}
                        {!initialLoading && (
                           <p className="text-[14px]] font-semibold text-gray-500 w-[100px]">
                              {!isChecked
                                 ? (songCount ? songCount : 0) + " songs"
                                 : selectedSongs.length + " selected"}
                           </p>
                        )}
                        {isChecked && adminSongs.length && (
                           <>
                              <Button
                                 onClick={handleSelectAll}
                                 variant={"primary"}
                                 className={classes.button}
                              >
                                 All
                              </Button>
                              <Button
                                 onClick={() => handleOpenModal("confirm")}
                                 variant={"primary"}
                                 className={classes.button}
                              >
                                 Delete
                              </Button>
                              <Button
                                 onClick={() => {
                                    setIsChecked(false);
                                    setSelectedSongs([]);
                                 }}
                                 className={`px-[5px]`}
                              >
                                 <XMarkIcon className="w-[25px]" />
                              </Button>
                           </>
                        )}
                     </div>

                     {/* {renderSongs()} */}
                     {!initialLoading && (
                        <SongList
                           admin
                           activeExtend={false}
                           handleSetSong={() => {}}
                           isChecked={isChecked}
                           setIsChecked={setIsChecked}
                           selectedSongs={selectedSongs}
                           setSelectedSongs={setSelectedSongs}
                           songs={adminSongs}
                        />
                     )}
                     {renderTempSongsList()}
                  </>
               )}

               {tab === "users" && (
                  <div className={classes.tableContainer}>
                     <table className="w-full">
                        <thead
                           className={`${theme.bottom_player_bg} w-full text-[14px] py-[4px]`}
                        >
                           <tr>
                              <th></th>
                              <th className="text-left py-[4px]">Name</th>
                              <th className="text-left py-[4px]">Email</th>
                              <th className="text-left py-[4px]">Latest Seen</th>
                           </tr>
                        </thead>
                        <tbody>{renderUsersList()}</tbody>
                     </table>
                  </div>
               )}
            </div>
         </div>

         {isOpenModal && (
            <Modal theme={theme} setOpenModal={setIsOpenModal}>
               {modalName === "confirm" && (
                  <ConfirmModal
                     loading={loading}
                     label={`Delete '${selectedList.length} adminSongs'`}
                     desc={"This action cannot be undone"}
                     theme={theme}
                     callback={handleDeleteSongs}
                     setOpenModal={setIsOpenModal}
                  />
               )}

               {modalName === "addPlaylist" && (
                  <AddPlaylist
                     // cb={handleGetAndSetAdminPlaylists}
                     setIsOpenModal={setIsOpenModal}
                     theme={theme}
                     admin={true}
                  />
               )}
            </Modal>
         )}
      </>
   );
}
