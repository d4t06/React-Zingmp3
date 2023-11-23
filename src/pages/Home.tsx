import { useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  QueueListIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Song } from "../types";

import {
  selectAllSongStore,
  setSong,
  useTheme,
  useSongsStore,
  useAuthStore,
  useActuallySongs,
  useToast,
} from "../store";
import {
  Button,
  LinkItem,
  Modal,
  Avatar,
  AppInfo,
  Appearance,
  ConfirmModal,
  PlaylistItem,
  SongList,
} from "../components";
// hooks
import { useAuthState } from "react-firebase-hooks/auth";
import { useSongs } from "../hooks";
// config
import { routes } from "../routes";
import { auth } from "../config/firebase";
import Skeleton, {
  SongItemSkeleton,
  MobileLinkSkeleton,
  PlaylistSkeleton,
} from "../components/skeleton";

import { useAuthActions } from "../store/AuthContext";
import { selectAllPlayStatusStore } from "../store/PlayStatusSlice";
import { SongWithSongIn } from "../store/SongSlice";

export default function HomePage() {
  // use store
  const dispatch = useDispatch();
  const [loggedInUser, loading] = useAuthState(auth);

  const { theme } = useTheme();
  const { setSuccessToast } = useToast();
  const { userInfo } = useAuthStore();
  const { adminSongs, adminPlaylists } = useSongsStore();
  const { loading: useSongLoading } = useSongs({});
  const { song: songInStore } = useSelector(selectAllSongStore);
  const {
    playStatus: { isPlaying },
  } = useSelector(selectAllPlayStatusStore);

  // states
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);

  // ref
  const modalName = useRef<"theme" | "info" | "confirm" | "addSongToPlaylist">("theme");

  // use hooks
  const { logIn, logOut } = useAuthActions();
  const { actuallySongs, setActuallySongs } = useActuallySongs();

  // define callback functions
  const handleSetSong = (song: Song, index: number) => {
    if (songInStore.song_in !== "admin") {
      setActuallySongs(adminSongs);
      console.log("setActuallySongs");
    }

    if (songInStore.id === song.id) return;
    dispatch(setSong({ ...(song as SongWithSongIn), currentIndex: index }));
  };

  const isOnMobile = useMemo(() => window.innerWidth < 800, []);

  //   methods
  const handleLogIn = async () => {
    try {
      await logIn();
    } catch (error) {
      console.log(error);
    } finally {
      setIsOpenModal(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.log("signOut error", { messsage: error });
    } finally {
      setIsOpenModal(false);
    }
  };

  const handleOpenModal = (name: typeof modalName.current) => {
    modalName.current = name;
    setIsOpenModal(true);
  };

  const resetCheckedList = () => {
    setSelectedSongs([]);
    setIsChecked(false);
  };

  const addSongsToQueue = () => {
    const newQueue = [...actuallySongs, ...selectedSongs];
    setActuallySongs(newQueue);
    console.log("setActuallySongs");

    setSuccessToast({ message: "songs added to queue" });
  };

  // define styles
  const classes = {
    songItemContainer: `w-full border-b border-${theme.alpha} last:border-none`,
    icon: `w-6 h-6 mr-2 inline`,
    popupWrapper: "w-[400px] max-w-[calc(90vw-40px)]",
    themeContainer: "overflow-auto no-scrollbar h-[calc(70vh-60px)]  pb-[5vh]",
    themeList: "flex flex-row -mx-[10px] flex-wrap gap-y-[20px]",
    linkItem: `py-[10px] border-b border-${theme.alpha} last:border-none`,
    button: `${theme.content_bg} rounded-full`,
  };

  return (
    <>
      {/* mobile nav */}
      {isOnMobile && (
        <div className="pb-[20px]">
          <div className="flex flex-col gap-3 items-start ">
            <h1 className="text-[24px] font-bold">Library</h1>
            {userInfo.status === "loading" ? (
              // MobileLinkSkeleton
              ""
            ) : (
              <>
                {userInfo.email ? (
                  <LinkItem
                    className={classes.linkItem}
                    to={routes.MySongs}
                    icon={<MusicalNoteIcon className={classes.icon + theme.content_text} />}
                    label="All songs"
                    arrowIcon={<ChevronRightIcon className="w-5 h-5 text-gray-500" />}
                  />
                ) : (
                  <Button
                    onClick={handleLogIn}
                    className={`${theme.content_bg} rounded-[4px] px-[40px]`}
                    variant={"primary"}
                  >
                    Login
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
      <div className="pb-[30px]">
        <h3 className="text-[24px] font-bold mb-[14px]">Popular</h3>
        <div className="flex flex-row flex-wrap -mx-[8px] mb-[30px]">
          {/* admin playlist */}
          {useSongLoading && PlaylistSkeleton}

          {!useSongLoading &&
            !!adminPlaylists.length &&
            adminPlaylists.map((playlist, index) => (
              <div key={index} className="w-1/2 min-[800px]:w-1/4 px-[8px]">
                <PlaylistItem
                  active={isPlaying && songInStore.song_in.includes(playlist.id)}
                  theme={theme}
                  data={playlist}
                />
              </div>
            ))}
        </div>

        <div className="h-[30px] mb-[10px] flex items-center gap-[8px]">
          <h3 className="text-2xl font-bold mr-[14px]">Songs</h3>

          {!isOnMobile && isChecked && (
            <p className="text-[13px] font-medium">{selectedSongs.length + " selected"}</p>
          )}
          {isChecked && selectedSongs.length && (
            <>
              <Button
                onClick={addSongsToQueue}
                variant={"outline"}
                size={"small"}
                className={`border-${theme.alpha} ${theme.side_bar_bg}`}
              >
                <QueueListIcon className="w-[20px] mr-[4px]" />
                Add to songs queue
              </Button>

              <Button
                variant={"circle"}
                onClick={resetCheckedList}
                className={`p-[4px] border border-${theme.alpha} ${theme.side_bar_bg}`}
              >
                <XMarkIcon className="w-[20px]" />
              </Button>
            </>
          )}
        </div>

        {/* admin song */}
        {useSongLoading && SongItemSkeleton}

        {!useSongLoading && (
          <>
            {!!adminSongs.length ? (
              <SongList
                isChecked={isChecked}
                setIsChecked={setIsChecked}
                selectedSongs={selectedSongs}
                setSelectedSongs={setSelectedSongs}
                handleSetSong={handleSetSong}
                activeExtend={songInStore.song_in === "admin"}
                songs={adminSongs}
              />
            ) : (
              <h1 className="text-[22px] text-center">...</h1>
            )}
          </>
        )}
      </div>

      {/* mobile setting */}
      {isOnMobile && (
        <div className="pb-[30px]">
          <h3 className="text-[24px] font-bold mb-[10px]">Setting</h3>
          <Avatar className="h-[65px] w-[65px]" />
          {loading ? (
            <Skeleton className="my-[8px] h-[27px]" />
          ) : (
            <p className="text-[18px] font-[500] my-[8px]">
              {loggedInUser?.displayName || "Guest"}
            </p>
          )}

          {loading ? (
            [...Array(3).keys()].map(() => MobileLinkSkeleton)
          ) : (
            <>
              <LinkItem
                className={classes.linkItem}
                icon={<PaintBrushIcon className={classes.icon} />}
                label="Theme"
                onClick={() => handleOpenModal("theme")}
              />
              <LinkItem
                className={classes.linkItem}
                icon={<InformationCircleIcon className={classes.icon} />}
                label="Info"
                onClick={() => handleOpenModal("info")}
              />
              {userInfo.email && (
                <LinkItem
                  className={classes.linkItem}
                  icon={<ArrowRightOnRectangleIcon className={classes.icon} />}
                  label="Logout"
                  onClick={() => handleOpenModal("confirm")}
                />
              )}
            </>
          )}
        </div>
      )}

      {isOpenModal && (
        <Modal theme={theme} setOpenModal={setIsOpenModal} classNames="w-[90vw]">
          {modalName.current === "confirm" && (
            <ConfirmModal
              setOpenModal={setIsOpenModal}
              callback={handleSignOut}
              loading={false}
              theme={theme}
              label="Log out ?"
            />
          )}
          {modalName.current === "info" && <AppInfo setIsOpenModal={setIsOpenModal} />}
          {modalName.current === "theme" && <Appearance setIsOpenModal={setIsOpenModal} />}
        </Modal>
      )}
    </>
  );
}
