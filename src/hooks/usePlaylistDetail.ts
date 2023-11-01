import { Playlist, Song } from "../types";
import { PlaylistParamsType, routes } from "../routes";

import { useEffect, useState, MutableRefObject, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { Status, selectAllSongStore, setPlaylist } from "../store/SongSlice";
import { useSongsStore } from "../store/SongsContext";

import useSong from "./useSongs";
import { useAuthStore } from "../store/AuthContext";
import { useToast } from "../store/ToastContext";
import { mySetDoc, setUserPlaylistIdsDoc } from "../utils/firebaseHelpers";
import { updatePlaylistsValue } from "../utils/appHelpers";

type Props = {
  playlistInStore: Playlist;
  songInStore: Song & Status;
  firstTimeRender: MutableRefObject<boolean>;
};

export default function usePlaylistDetail({ firstTimeRender }: Props) {
  // use store
  const dispatch = useDispatch();
  const { userInfo } = useAuthStore();
  // const { setActuallySongs } = useActuallySongs();
  const { song: songInStore, playlist: playlistInStore } = useSelector(selectAllSongStore);
  const { loading: useSongLoading, errorMsg: useSongErrorMsg, initial } = useSong();
  const { adminSongs, userSongs, userPlaylists, setUserPlaylists } = useSongsStore();

  // state
  const [loading, setLoading] = useState(useSongLoading);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const firstRunGetPlaylistSongs = useRef(true);
  const prevSongsLength = useRef(0);

  // use hook
  const { setErrorToast } = useToast();
  const params = useParams<PlaylistParamsType>();
  const navigate = useNavigate();

  const getAndSetPlaylist = useCallback(async () => {
    if (!initial || !params.id) {
      navigate(routes.Home);
      return;
    }

    const playList = userPlaylists.find((playlist) => playlist.id === params.id);

    if (playList) {
      console.log("set playlist after init");
      dispatch(setPlaylist(playList));
      setLoading(false);
    }
  }, [params, userInfo]);

  const getPlaylistSongs = useCallback(() => {
    console.log("get playlist songs");

    let playlistSongs: Song[] = [];
    let targetSongs: Song[];

    if (!playlistInStore.song_ids.length) {
      setPlaylistSongs([]);
      return;
    }

    const isContainAdminSongs = playlistInStore.song_ids.some((songId) => songId.includes("admin"));

    if (isContainAdminSongs) {
      targetSongs = [...adminSongs, ...userSongs];
    } else {
      switch (playlistInStore.by) {
        case "admin":
          targetSongs = adminSongs;
          break;
        default:
          targetSongs = userSongs;
      }
    }

    playlistInStore.song_ids.forEach((songId) => {
      const song = targetSongs.find((song) => songId === song.id);
      if (song) {
        playlistSongs.push(song);
      }
    });

    if (playlistInStore.song_ids.length !== playlistSongs.length) {
      console.log("get playlist song error");
      setErrorToast({});
      return;
    }

    setPlaylistSongs(playlistSongs);

    if (!prevSongsLength.current) prevSongsLength.current = playlistSongs.length;

  }, [playlistInStore.song_ids, userSongs]);

  const setPlaylistImageToDoc = useCallback(async (newPlaylist: Playlist) => {
    try {
      await mySetDoc({
        collection: "playlist",
        id: playlistInStore.id,
        data: { newPlaylist },
      });
    } catch (error) {
      console.log("error when set playlist image");
      setErrorToast({});
    }
  }, []);

  // get playlist after initial
  useEffect(() => {
    console.log("useEffect 1", firstTimeRender.current);

    if (firstTimeRender.current || initial) {
      if (!initial || useSongErrorMsg) return;

      if (playlistInStore.id === params.id) {
        console.log("already have playlist");
        setLoading(false);
        return;
      }

      getAndSetPlaylist();
    }
  }, [initial]);

  // get playlist songs, run after get playlist
  useEffect(() => {
    // console.log("useEffect 2");

    if (firstTimeRender.current || playlistInStore.song_ids) {
      if (!playlistInStore.name || useSongErrorMsg) return;

      if (playlistInStore.id !== params.id) return;

      getPlaylistSongs();
    }
  }, [playlistInStore.song_ids]);

  // for update playlist feature image
  useEffect(() => {
    if (firstTimeRender.current || playlistSongs.length) {
      if (!initial) return;

      if (!playlistSongs.length) return;

      const firstSongHasImage = playlistSongs.find((song) => song.image_url);

      if (
        !firstSongHasImage ||
        (playlistInStore.image_url && playlistInStore.image_url === firstSongHasImage.image_url)
      )
        return;

      console.log("get playlist feature image");

      const newPlaylist: Playlist = {
        ...playlistInStore,
        image_url: firstSongHasImage.image_url,
        blurhash_encode: firstSongHasImage.blurhash_encode || "",
      };

      setPlaylistImageToDoc(newPlaylist);
      // get new user playlist
      const newUserPlaylists = [...userPlaylists];
      updatePlaylistsValue(newPlaylist, newUserPlaylists);
      setUserPlaylists(newUserPlaylists, []);

      // update playlistInStore first
      // because the user can be in playlist detail page
      dispatch(setPlaylist(newPlaylist));

      // update users playlist to context
      setUserPlaylistIdsDoc(newUserPlaylists, userInfo);
    }
  }, [playlistSongs]);

  // for actually song after user add or remove song from playlist
  // only run when after play song in playlist then playlist songs change
  useEffect(() => {
    if (firstTimeRender.current || playlistSongs.length) {
      if (firstRunGetPlaylistSongs.current) {
        console.log("useEffect 3 first run get songs,  do nothing");
        firstRunGetPlaylistSongs.current = false;
        return;
      }

      const isPlayingPlaylist = songInStore.song_in.includes(playlistInStore.name);
      if (!isPlayingPlaylist) {
        console.log("useEffect 3 no longer play, do nothing");
        return;
      }

      console.log('check prev songs length',  prevSongsLength.current, playlistSongs.length);
      

      const isSecondTimesOpenPlaylist =
        params.id === playlistInStore.name && prevSongsLength.current === playlistSongs.length;

      if (isSecondTimesOpenPlaylist) {
        console.log("useEffect 3 second times open, do nothing");
        return;
      }

      
      console.log("useEffect 3 ");
      prevSongsLength.current = playlistSongs.length;
      // setActuallySongs(playlistSongs);

      firstTimeRender.current = false;
    }
  }, [playlistSongs]);

  return { playlistSongs, loading };
}