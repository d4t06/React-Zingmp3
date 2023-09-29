import { FC, useState } from "react";
// import PlaylistItem from "../components/ui/PlaylistItem";
import Empty from "../components/ui/Empty";
import Modal from "../components/Modal";
import Button from "../components/ui/Button";
import { XMarkIcon } from "@heroicons/react/24/outline";
// import { Playlist } from "../types";
import { useSongsStore } from "../store/SongsContext";
import { useTheme } from "../store/ThemeContext";

interface Props {}

const PlaylistPage: FC<Props> = () => {
   const {theme} = useTheme();

   const {userPlaylists} = useSongsStore()
   const [openModal, setOpenModal] = useState(false);
   const [playlistName, setPlayListName] = useState<string>("");

   const handleAddPlaylist = () => {

      setPlayListName("");
      setOpenModal(false);
   };

   return (
      <div className="">
         {/* header */}

         <h1 className="text-[24px] font-bold">Playlist</h1>

         <div className="flex flex-row gap-y-4 mt-[10px] flex-wrap mb-[30px]">
            <div className="w-1/4 max-[549px]:w-[50%]">
               <Empty
                  className="pb-[100%]"
                  onClick={() => setOpenModal(true)}
                  theme={theme}
               />
            </div>

            {userPlaylists.map((playlist, index) => {
               return (
                  <div key={index} className="w-1/4 px-4">
                     {JSON.stringify(playlist)}
                  </div>
               );
            })}
         </div>

         {openModal && (
            <Modal setOpenModal={setOpenModal}>
               <div className="w-[300px] bg-slate-800 rounded-xl px-5 py-7 relative">
                  <Button
                     className="absolute top-2 right-2 text-white"
                     onClick={() => setOpenModal(false)}
                  >
                     <XMarkIcon className="w-6 h-6" />
                  </Button>
                  <h2 className="text-xl text-white">Add Playlist</h2>
                  <input
                     className="bg-gray-300 rounded outline-none mt-3 text-xl pl-5 h-[40px] w-full"
                     type="text"
                     placeholder="Playlist..."
                     value={playlistName}
                     onChange={(e) => setPlayListName(e.target.value)}
                  />

                  <button
                     onClick={() => handleAddPlaylist()}
                     className={`mt-8 bg-indigo-600 h-[40px] w-full text-white text-xl rounded-full hover:brightness-90 ${
                        !playlistName ? "opacity-60 pointer-events-none" : ""
                     }`}
                  >
                     Add new
                  </button>
               </div>
            </Modal>
         )}
      </div>
   );
};

export default PlaylistPage;
