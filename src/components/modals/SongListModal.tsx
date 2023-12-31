import { useMemo, useState, SetStateAction, Dispatch } from "react";
import { Playlist, Song, ThemeType } from "../../types";
import { useSongsStore } from "../../store/SongsContext";
import Button from "../ui/Button";
import MobileSongItem from "../MobileSongItem";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import usePlaylistActions from "../../hooks/usePlaylistActions";
import ModalHeader from "./ModalHeader";
import { useSelector } from "react-redux";
import { selectAllSongStore, useActuallySongs } from "../../store";

type Props = {
   admin?: boolean;
   playlist: Playlist;
   playlistSongs: Song[];
   theme: ThemeType & { alpha: string };
   setPlaylistSongs: Dispatch<SetStateAction<Song[]>>;
   setIsOpenModal: Dispatch<SetStateAction<boolean>>;
};

export default function SongList({
   admin,
   theme,
   playlist,
   playlistSongs,
   setPlaylistSongs,
   setIsOpenModal,
}: Props) {
   const { song: songInStore } = useSelector(selectAllSongStore);
   const { actuallySongs, setActuallySongs } = useActuallySongs();
   const [selectedSongList, setSelectedSongList] = useState<Song[]>([]);

   // hook
   const { userSongs, adminSongs } = useSongsStore();
   const { addSongsToPlaylist, loading } = usePlaylistActions({});

   const classes = {
      addSongContainer: "pb-[50px] relative",
      addSongContent: "max-h-[calc(60vh)] w-[700px] max-w-[80vw] overflow-auto",
      songItem: "w-full max-[549px]:w-full",
   };

   const isAbleToSubmit = useMemo(() => !!selectedSongList.length, [selectedSongList]);
   const targetSongs = useMemo(() => (admin ? adminSongs : userSongs), [userSongs, adminSongs]);

   const handleAddSongsToPlaylist = async () => {
      try {
         if (!playlist || !selectedSongList.length || !setIsOpenModal || !setPlaylistSongs) {
            return;
         }

         await addSongsToPlaylist(selectedSongList, playlist);

         const newPlaylistSongs = [...playlistSongs, ...selectedSongList];
         setPlaylistSongs(newPlaylistSongs);

         if (songInStore.song_in === `playlist_${playlist.id}`) {
            console.log("set actually songs");
            const newSongs = [...actuallySongs, ...selectedSongList];
            setActuallySongs(newSongs);
         }
      } catch (error) {
         console.log(error);
      } finally {
         setIsOpenModal(false);
      }
   };

   return (
      <div className={classes.addSongContainer}>
         <ModalHeader setIsOpenModal={setIsOpenModal} title="Add song to playlist" />
         <div className={classes.addSongContent}>
            <Button
               onClick={handleAddSongsToPlaylist}
               variant={"primary"}
               className={`rounded-full ${
                  theme.content_bg
               } absolute bottom-0 right-15px min-w-[34px] h-[32px] ${
                  !isAbleToSubmit && "opacity-60 pointer-events-none"
               }`}
            >
               {loading ? <ArrowPathIcon className="w-[20px] animate-spin" /> : "Save"}
            </Button>
            {targetSongs.map((song, index) => {
               const isDifferenceSong = playlistSongs.findIndex((s) => s.id === song.id) === -1;

               if (isDifferenceSong) {
                  return (
                     <div key={index} className={classes.songItem}>
                        <MobileSongItem
                           isChecked={true}
                           selectedSongs={selectedSongList}
                           setSelectedSongs={setSelectedSongList}
                           theme={theme}
                           data={song}
                           active={false}
                           onClick={() => {}}
                           setIsChecked={() => {}}
                        />
                     </div>
                  );
               }
            })}
         </div>
      </div>
   );
}
