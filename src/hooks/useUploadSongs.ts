import { ChangeEvent, RefObject, useRef, useCallback, useEffect, useMemo, useState } from "react";
import { Song } from "../types";
import { generateId, getBlurhashEncode, parserSong } from "../utils/appHelpers";
import { useSongsStore } from "../store/SongsContext";
import { useToast } from "../store/ToastContext";
import { nanoid } from "nanoid";
import { mySetDoc, setUserSongIdsAndCountDoc, uploadBlob, uploadFile } from "../utils/firebaseHelpers";
import { initSongObject } from "../utils/appHelpers";
import { useAuthStore } from "../store/AuthContext";
// import { testSongs } from "./songs";
import { selectAllSongStore, useActuallySongs, useUpload } from "../store";
import { useSelector } from "react-redux";
import { SongWithSongIn } from "../store/SongSlice";

type Props = {
   audioRef: RefObject<HTMLAudioElement>;
   admin?: boolean;
   firstTempSong?: RefObject<HTMLDivElement>;
   testImageRef: RefObject<HTMLImageElement>;
   inputRef: RefObject<HTMLInputElement>;
};

// event listener
// await promise
// object assign
export default function useUploadSongs({
   audioRef,
   admin,
   inputRef,
   testImageRef,
}: // firstTempSong,
Props) {
   // use stores
   const { userInfo } = useAuthStore();
   const { setTempSongs: _setTempSongs, tempSongs, setAddedSongIds: _setAddedSongIds, setStatus, status } = useUpload();
   const { setErrorToast, setSuccessToast, setToasts } = useToast();
   const { setUserSongs, userSongs, setAdminSongs, adminSongs } = useSongsStore();
   const { setActuallySongs, actuallySongs } = useActuallySongs();
   const { song: songInStore } = useSelector(selectAllSongStore);

   const [triggerUpdateActuallySongs, setTriggerUpdateActuallySongs] = useState<Song>();

   const duplicatedFile = useRef<Song[]>([]);
   const actuallyFileIds = useRef<number[]>([]);
   const isDuplicate = useRef(false);

   const targetSongs = useMemo(() => (admin ? adminSongs : userSongs), [userSongs, adminSongs]);

   const finishAndClear = (sts: typeof status) => {
      if (!inputRef.current) return;
      const inputEle = inputRef.current as HTMLInputElement;
      if (inputEle) {
         inputEle.value = "";
         inputEle;
         actuallyFileIds.current = [];

         setStatus(sts);
      }
   };

   // closure
   const logger = (type: "error" | "success") => {
      const log = (msg: string) => console.log(`[${type}]: ${msg}`);
      return log;
   };
   const errorLogger = logger("error");

   const handleInputChange = useCallback(
      async (e: ChangeEvent<HTMLInputElement>) => {
         if (!userInfo.email) {
            setErrorToast({ message: "Missing user data" });
            return;
         }
         setStatus("uploading");

         const inputEle = e.target as HTMLInputElement & { files: FileList };
         const fileLists = inputEle.files;

         if (!fileLists.length) {
            setStatus("finish");
            return;
         }

         // init song object
         let data = initSongObject({
            by: admin ? "admin" : (userInfo.email as string),
         });

         let processSongsList: Song[] = [];

         const start = Date.now();
         const checkDuplicate = (songObject: Song) => {
            return (
               targetSongs.some(
                  (s) => s.singer === songObject.singer && s.name === songObject.name && s.size === songObject.size
               ) ||
               processSongsList.some(
                  (s) => s.singer === songObject.singer && s.name === songObject.name && s.size === songObject.size
               )
            );
         };
         // add tempSongs => upload files => add doc
         try {
            // init tempsSongs, push actuallyFileIds
            let i;
            for (i = 0; i <= fileLists.length - 1; i++) {
               const songFile = fileLists[i];
               const songData = await parserSong(songFile);

               // console.log("check song data", songData);
               if (!songData) {
                  setErrorToast({ message: "Error when parser song" });
                  finishAndClear("finish-error");

                  return;
               }

               // init song data
               let songFileObject: Song = {
                  ...data,
                  name: songData.name,
                  singer: songData.singer,
                  size: Math.floor(songFile.size / 1024),
               };

               // case song have stock image
               let imageBlob;
               if (songData.image) {
                  imageBlob = new Blob([songData.image], {
                     type: "application/octet-stream",
                  });

                  const url = URL.createObjectURL(imageBlob);
                  songFileObject.image_url = url;
               }

               // case song is duplicate
               const duplicated = checkDuplicate(songFileObject);
               if (duplicated) {
                  console.log(">>>duplicate");
                  isDuplicate.current = true;
                  duplicatedFile.current.push(songFileObject);

                  continue;
               }

               processSongsList.push(songFileObject);

               // add actuallyFileIds, and assign for_song_id, imageBlob to actuallyFile
               actuallyFileIds.current = [...actuallyFileIds.current, i];
               Object.assign(songFile, {
                  for_song_id: processSongsList.length - 1,
                  imageBlob,
               } as {
                  for_song_id: number;
                  imageBlob: Blob;
               });
            }

            // check limit
            if (userSongs.length + actuallyFileIds.current.length > 5) {
               if (userInfo.role !== "admin") {
                  finishAndClear("finish-error");
                  setErrorToast({ message: "You have reach the upload limit" });
                  return;
               }
            }

            // case all song are duplicate
            if (!processSongsList.length) {
               isDuplicate.current = false;
               setStatus("finish-error");
               finishAndClear("finish-error");
               setErrorToast({ message: "Duplicate song" });
               return;
            }

            // inti songItem to render to view
            _setTempSongs(processSongsList);

            // upload song file, image file and get blurhash encode
            for (let fileIndex of actuallyFileIds.current) {
               let newSongFile = fileLists[fileIndex] as File & {
                  for_song_id: number;
                  imageBlob: Blob;
               };

               // generateSongId
               let songId = generateId(processSongsList[newSongFile.for_song_id].name);

               if (admin) {
                  songId += "_admin";
               }

               // upload song list
               const idInProcessSongsList = newSongFile.for_song_id;
               const songNeedToUpdate = {
                  ...processSongsList[idInProcessSongsList],
               };

               // case song have stock image
               if (songNeedToUpdate.image_url) {
                  console.log("have stock image");

                  await handleUploadImage(newSongFile.imageBlob, songId, songNeedToUpdate);
               }

               //  upload song file
               const { filePath, fileURL } = await uploadFile({
                  file: newSongFile,
                  folder: "/songs/",
                  email: userInfo.email,
                  msg: ">>> api: upload song file",
               });

               processSongsList[idInProcessSongsList] = {
                  ...songNeedToUpdate,
                  id: songId,
                  song_file_path: filePath,
                  song_url: fileURL,
               };

               //  update audio src
               const audioEle = audioRef.current as HTMLAudioElement;
               audioEle.src = URL.createObjectURL(newSongFile);

               // upload song doc
               await handleUploadSong(processSongsList, idInProcessSongsList);
            }
         } catch (error: any) {
            finishAndClear("finish-error");
            setErrorToast({ message: "Error when upload song file" });

            // setTempSongs([]);
            _setTempSongs([]);
            return;
         }

         // after upload songs finish
         // upload user data => clear tempSongs => update songsContext
         try {
            // reset fileList
            actuallyFileIds.current = [];

            // case user
            if (!admin) {
               const actuallySongIds: string[] = processSongsList.map((song) => song.id);
               const userSongIds: string[] = userSongs.map((song) => song.id);
               const newUserSongsIds = [...userSongIds, ...actuallySongIds];

               // update user doc
               await setUserSongIdsAndCountDoc({
                  songIds: newUserSongsIds,
                  userInfo: userInfo,
               });
            }

            if (admin) setAdminSongs([...adminSongs, ...processSongsList]);
            else setUserSongs([...userSongs, ...processSongsList]);

            // setTempSongs([]);
            _setTempSongs([]);

            // case admin
            if (isDuplicate.current) {
               finishAndClear("finish-error");
               setToasts((t) => [...t, { id: nanoid(4), title: "warning", desc: "Song duplicate" }]);
            } else {
               finishAndClear("finish");
               // if upload gather than 1 file
               setSuccessToast({
                  message: `${processSongsList.length} songs uploaded`,
               });
            }

            const finish = Date.now();
            console.log(">>> upload songs finished after", (finish - start) / 1000);
         } catch (error) {
            errorLogger(`catch 2 erorr ${error}`);
            setErrorToast({ message: "Update user data failed" });
            finishAndClear("finish-error");

            return;
         }
      },

      [userInfo, userSongs, songInStore.song_in]
   );

   const handleUploadImage = async (imageBlob: Blob, songId: string, songNeedToUpdate: Song) => {
      return new Promise<void>((rs, rj) => {
         const testImageEle = testImageRef.current as HTMLImageElement;
         const imageURL = URL.createObjectURL(imageBlob);
         // assign image url
         testImageEle.src = imageURL;

         const uploadImage = async () => {
            try {
               URL.revokeObjectURL(imageURL);

               const { encode } = await getBlurhashEncode(imageBlob);
               const { fileURL, filePath } = await uploadBlob({
                  blob: imageBlob,
                  folder: "/images/",
                  songId,
                  msg: `>>> api: upload song's image blob`,
               });

               if (encode) songNeedToUpdate.blurhash_encode = encode;
               songNeedToUpdate.image_url = fileURL;
               songNeedToUpdate.image_file_path = filePath;

               rs();
            } catch (error) {
               errorLogger("upload image error");
               testImageEle.removeEventListener("error", handleError);
               rj();
            } finally {
               testImageEle.removeEventListener("load", uploadImage);
            }
         };

         const handleError = () => {
            errorLogger("stock image error");

            URL.revokeObjectURL(imageURL);
            songNeedToUpdate.image_url = "";
            testImageEle.removeEventListener("error", handleError);

            rs();
         };

         testImageEle.addEventListener("load", uploadImage);
         testImageEle.addEventListener("error", handleError);
      });
   };

   // get song duration and upload song doc
   const handleUploadSong = async (processSongsList: Song[], index: number) => {
      return new Promise<void>((resolve, reject) => {
         const audioEle = audioRef.current as HTMLAudioElement;
         const upload = async () => {
            try {
               let song = processSongsList[index];
               // update songList
               const duration = Math.ceil(audioEle.duration);
               song = {
                  ...song,
                  duration,
               };
               processSongsList[index] = {
                  ...song,
                  song_in: admin ? "admin" : "user",
               } as SongWithSongIn;

               // add to firebase
               await mySetDoc({
                  collection: "songs",
                  data: song,
                  id: song.id,
                  msg: ">>> api: set song doc",
               });

               // update new song list (include new song_url....)
               _setTempSongs(processSongsList);

               // update added song
               _setAddedSongIds((prev) => [...prev, song.id]);

               if (admin || songInStore.song_in === "user") {
                  setTriggerUpdateActuallySongs(processSongsList[index]);
                  console.log("trigger update actually songs");
               }

               // when song uploaded
               URL.revokeObjectURL(audioEle.src);

               console.log(processSongsList[index].name, "uploaded");

               resolve();
            } catch (error) {
               errorLogger("upload song file error");
               reject();
            } finally {
               audioEle.removeEventListener("loadedmetadata", upload);
            }
         };

         audioEle.addEventListener("loadedmetadata", upload);
      });
   };

   useEffect(() => {
      if (!triggerUpdateActuallySongs) return;

      const newActuallySongs = [...actuallySongs];
      newActuallySongs.push(triggerUpdateActuallySongs);

      setActuallySongs(newActuallySongs);
      console.log("setActuallySongs when upload song");
   }, [triggerUpdateActuallySongs?.id]);

   useEffect(() => {
      const firstTempSong = document.querySelector(".temp-song") as HTMLDivElement;
      if (!firstTempSong) return;

      firstTempSong.scrollIntoView({ behavior: "smooth", block: "center" });
   }, [tempSongs]);

   return { handleInputChange };
}
