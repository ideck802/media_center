import vlc
import time
import eel
import os
from sys import platform
import json
import random
import datetime
import requests
import re
import pywinctl as pwc
from moviepy.audio.io.AudioFileClip import AudioFileClip
if platform == 'win32':
    from ctypes import windll
    import win32api

#if not os.path.exists('/home/talking_human/media/music/'):
#    os.popen('sh ./mount_smb.sh')

vlc_inst = vlc.Instance()
media_player = vlc_inst.media_player_new()
media_list_player = vlc_inst.media_list_player_new()
playlist = vlc_inst.media_list_new()
#media = vlc_inst.media_new("./loki.mkv")
#playlist.add_media(media)
media_list_player.set_media_list(playlist)

#media_player.set_fullscreen(True)

media_list_player.set_media_player(media_player)

tmdb_api_key = '7367e424c44bfc1f6fa68e01e9c7e575'

#media_list_player.play()

movie_paths = []
show_paths = []

oneonly = True
oneonly2 = True

title_bar_offset = 55

video_open = False

screens = pwc.getAllScreens()
for key in screens:
    if (screens[key]['pos'].x == 0):
        global screen_size
        global work_area
        screen_size = pwc.getScreenSize(key)
        work_area = pwc.getWorkArea(key)

is_shrunk = False

@eel.expose
def init():
    global gui_window
    eel.sleep(1)
    gui_window = pwc.getWindowsWithTitle('Template')[0]
    expand_gui()

@eel.expose
def reenter_fullscreen():
    media_player.set_fullscreen(False)
    move_vlc_window()

def move_vlc_window():
    video_window.restore()
    eel.sleep(1)
    if (platform == 'linux'):
        #win = pwc.getWindowsWithTitle('VLC media player')[0]
        video_window.moveTo(0, work_area.bottom - screen_size.height)
        video_window.resizeTo(500, 500)
        media_player.set_fullscreen(True)
    elif (platform == 'win32'):
        #win = pwc.getWindowsWithTitle('VLC (Direct3D11 output)')[0]
        print('move: ' + str(video_window.moveTo(0, int(work_area.bottom/2))))
        video_window.resizeTo(500, 500)
        media_player.set_fullscreen(True)
    #video_window.watchdog.start(isActiveCB=bring_gui_front)

def bring_gui_front(active = None):
    if (not is_hidden):
        gui_window.raiseWindow()

def toggle_taskbar(active):
    if (active == False and video_open == True):
        windll.user32.ShowWindow(windll.user32.FindWindowA(b'Shell_TrayWnd', None), 9)
    elif (active == True and video_open == True):
        windll.user32.ShowWindow(windll.user32.FindWindowA(b'Shell_TrayWnd', None), 0)

@eel.expose
def shrink_gui():
    global is_shrunk
    is_shrunk = True
    if (platform == 'linux'):
        gui_window.moveTo(0, work_area.bottom - (58 + title_bar_offset))
        gui_window.resizeTo(screen_size.width, 58)
        bring_gui_front()
    elif (platform == 'win32'):
        gui_window.moveTo(0, work_area.bottom - (58 + title_bar_offset))
        gui_window.resizeTo(screen_size.width, 58 + title_bar_offset)
        bring_gui_front()
    eel.drawResizeArrow('shrink')
        

@eel.expose
def expand_gui():
    global is_shrunk
    is_shrunk = False
    print(pwc.getAllScreens())
    if (platform == 'linux'):
        gui_window.moveTo(0, work_area.bottom - (screen_size.height - (100 - title_bar_offset)))
        gui_window.resizeTo(screen_size.width, screen_size.height - 100)
        bring_gui_front()
    elif (platform == 'win32'):
        gui_window.moveTo(0, work_area.bottom - (screen_size.height - (100 - title_bar_offset)))
        gui_window.resizeTo(screen_size.width, screen_size.height - (100 - title_bar_offset))
        bring_gui_front()
        global oneonly2
        if oneonly2:
            gui_window.watchdog.start(isActiveCB=toggle_taskbar)
            oneonly2 = False
    eel.drawResizeArrow('expand')

@eel.expose
def get_shrunk_status():
    return is_shrunk

def watch_mouse():
    global is_hidden
    eel.sleep(5)
    xpos = 0
    ypos = 0
    pos_same_count = 0
    is_hidden = False
    while True:
        mousepos = pwc.getMousePos()
        if (xpos == mousepos.x and ypos == mousepos.y):
            pos_same_count += 1
        else:
            pos_same_count = 0
            if (is_hidden):
                #show gui window
                print('show gui')
                gui_window.restore()
                eel.sleep(0.3)
                shrink_gui()
                is_hidden = False
        xpos = mousepos.x
        ypos = mousepos.y
        if (video_open and pos_same_count == 3):
            #hide gui window
            gui_window.minimize()
            is_hidden = True
        eel.sleep(1)

eel.spawn(watch_mouse)


@eel.expose
def save_settings(data):
    with open('./settings.ini', 'w') as ini_file:
        ini_file.write(data)
        ini_file.close()
    read_settings()

@eel.expose
def read_settings():
    global movie_paths
    global show_paths
    global music_paths
    ini_file = open('./settings.ini', 'r')
    contents = ini_file.read()
    ini_file.close()
    data = json.loads(contents)
    movie_paths = data['moviePaths']
    show_paths = data['showPaths']
    music_paths = data['musicPaths']
    return contents
    
radio_stations = []
run_radio = True

def save_stations():
    with open('./radio_stations.ini', 'w') as radio_ini:
        radio_ini.write(json.dumps(radio_stations))
        radio_ini.close()

if platform == 'linux':
    vlc_prefix = 'file://'
elif platform == 'win32':
    vlc_prefix = 'file:///'

@eel.expose
def load_stations():
    global radio_stations
    radio_ini = open('./radio_stations.ini', 'r')
    stations = radio_ini.read()
    radio_ini.close()
    radio_stations = json.loads(stations)
    for station in radio_stations:
        print('HEY: ' + str(station))
        if (any(station['path'].endswith(string) for string in ['mp3', 'mp4', 'mkv', 'm4a', 'ogg', 'wav'])):
            station['length'] = round(AudioFileClip(station['path']).duration)
        elif (station['path'].endswith('.lst')):
            plylst_file = open(station['path'], 'r')
            contents = plylst_file.read()
            plylst_file.close()
            data = json.loads(contents)
            station['filesCnt'] = len(data) - 1
            path = data[station['fileAt']]['path'].replace('%20', ' ').replace('%21', '!').replace(vlc_prefix, '')
            station['length'] = round(AudioFileClip(path).duration)

    print(radio_stations)
    eel.spawn(radio_loop)

@eel.expose
def get_stations():
    return radio_stations

@eel.expose
def write_stations(stations):
    global radio_stations
    global run_radio
    radio_stations = stations
    run_radio = False
    eel.sleep(1)
    run_radio = True
    save_stations()
    load_stations()

def radio_loop():
    while run_radio:
        for station in radio_stations:
            if (any(station['path'].endswith(string) for string in ['mp3', 'mp4', 'mkv', 'm4a', 'ogg', 'wav'])):
                if (station['time'] == station['length']):
                    station['time'] = 0
                else:
                    station['time'] += 1
            elif (station['path'].endswith('.lst')):
                if (station['time'] == station['length']):
                    station['time'] = 0
                    if (station['fileAt'] == station['filesCnt']):
                        station['fileAt'] = 0
                    else:
                        station['fileAt'] += 1
                    path = media_player.get_media().get_mrl().replace('%20', ' ').replace('%21', '!').replace(vlc_prefix, '')
                    station['length'] = round(AudioFileClip(path).duration)
                else:
                    station['time'] += 1
        eel.sleep(1)

radio_playing = [False, None]

@eel.expose
def play_radio(station):
    global radio_stations
    global radio_playing
    if radio_playing[0]:
        radio_stations[radio_playing[1]]['time'] = round(media_player.get_time()/1000)
        radio_stations[radio_playing[1]]['fileAt'] = playlist.index_of_item(media_player.get_media())
        path = media_player.get_media().get_mrl().replace('%20', ' ').replace('%21', '!').replace(vlc_prefix, '')
        radio_stations[radio_playing[1]]['length'] = round(AudioFileClip(path).duration)
        save_stations()
    radio_playing = [True, station]
    info = radio_stations[station]
    media_list_player.set_playback_mode(vlc.PlaybackMode.loop)
    print('right before play_file')
    play_file(info['path'], info['time'], info['fileAt'])

def get_subs():
    subs = media_player.video_get_spu_description()
    active_sub = media_player.video_get_spu()
    for sub in subs:
        if sub[0] == active_sub:
            active_sub = sub[1].decode('utf-8')
            break
    eel.getSubs([track[1].decode('utf-8') for track in subs], active_sub)

@eel.expose
def set_subs(selected_sub):
    subs = media_player.video_get_spu_description()
    for sub in subs:
        if sub[1].decode('utf-8') == selected_sub:
            media_player.video_set_spu(sub[0])
            break

def get_audios():
    audios = media_player.audio_get_track_description()
    active_audio = media_player.audio_get_track()
    for audio in audios:
        if audio[0] == active_audio:
            active_audio = audio[1].decode('utf-8')
            break
    eel.getAudios([track[1].decode('utf-8') for track in audios], active_audio)

@eel.expose
def set_audio_track(selected_audio):
    audios = media_player.audio_get_track_description()
    for audio in audios:
        if audio[1].decode('utf-8') == selected_audio:
            media_player.audio_set_track(audio[0])
            break

def read_dir(dir_path):
    items = []
    for entry in sorted(os.scandir(dir_path), key=lambda e: (not e.is_dir(), e.name)):
        if entry.is_dir():
            folder_item = {
                'name': entry.name,
                'type': 'folder',
                'path': entry.path
            }
            items.append(folder_item)
        else:
            file_item = {
                'name': entry.name,
                'type': 'file',
                'path': entry.path
            }
            items.append(file_item)
    if (len(items) == 0):
        return ['empty', dir_path + '/placeholder']
    else:
        return items

@eel.expose
def set_override(path, metadata_id):
    path = path.replace('`', '')
    if (any(item in path for item in show_paths)):
        json_metadata = "{\"id\": \"" + metadata_id + "\"}"
        with open('./web/cached_metadata/' + os.path.basename(path) + '_txt.txt', 'w') as txt_file:
            txt_file.write(json_metadata)
            txt_file.close()
    elif (any(item in path for item in movie_paths)):
        json_metadata = "{\"id\": \"" + metadata_id + "\"}"
        with open('./web/cached_metadata/' + os.path.basename(path) + '_txt.txt', 'w') as txt_file:
            txt_file.write(json_metadata)
            txt_file.close()

@eel.expose
def get_metadata(media_type, file_name, num_results = 1):
    if (media_type == 'mov_id'):
        response = requests.get('https://api.themoviedb.org/3/' + 'movie/' + file_name, params={'api_key': tmdb_api_key, 'language': 'en-US'}).json()
        print(response)
        return response
    elif (media_type == 'tv_id'):
        response = requests.get('https://api.themoviedb.org/3/' + 'tv/' + file_name, params={'api_key': tmdb_api_key, 'language': 'en-US'}).json()
        print(response)
        return response
    else:
        file_name = os.path.splitext(file_name)[0].lower().translate(dict.fromkeys(map(ord, u',\'')))
        if (file_name[-4:].isdigit()):
            year = file_name[-4:]
            file_name = file_name[:-5]
            response = requests.get('https://api.themoviedb.org/3/search/' + media_type, params={'query': file_name, 'primary_release_year': year, 'api_key': tmdb_api_key, 'language': 'en-US'}).json()
        else:
            response = requests.get('https://api.themoviedb.org/3/search/' + media_type, params={'query': file_name, 'api_key': tmdb_api_key, 'language': 'en-US'}).json()
    
        print(response)

        correct_movie = None

        if (media_type == 'movie'):
            for movie in response['results']:
                movie_name = movie['original_title'].translate(dict.fromkeys(map(ord, u',\':*?<>|'))).lower()
                if (movie_name == file_name):
                    correct_movie = movie
                    break
                else:
                    continue
        elif (media_type == 'tv'):
            for show in response['results']:
                show_name = show['original_name'].translate(dict.fromkeys(map(ord, u',\':*?<>|'))).lower()
                if (show_name == file_name):
                    correct_movie = show
                    break
                else:
                    continue
    
        print("|" + file_name + "|")
        eel.sleep(0.1)
        if (num_results > 1):
            return response['results'][:(num_results+1)]
        elif (not correct_movie == None):
            print(correct_movie)
            return correct_movie
        else:
            try:
                return response['results'][0]
            except:
                return None

def scan_files(path):
    files = []
    for item in read_dir(path):
        if (item['type'] == 'folder'):
            files += scan_files(item['path'])
        else:
            files.append(item)
    return files


@eel.expose
def handle_watched_data(path, value = None):
    if (any(item in path for item in movie_paths) or any(item in path for item in show_paths)):
        path = path.replace(' ', '-').lower()
        name = os.path.splitext(os.path.basename(path))[0]
        existing_data = open('./watched_data.ini', 'r')
        contents = json.loads(existing_data.read())
        existing_data.close()
        if (not value == None):
            if (re.search(r"season-\d{2}", name)):
                if (not contents.get(os.path.basename(os.path.dirname(path))) == None):
                    contents[os.path.basename(os.path.dirname(path))]['s' + re.search(r"season-(\d{2})", name).group(1)] = {"watched": value}
                else:
                    contents[os.path.basename(os.path.dirname(path))] = {'s' + re.search(r"season-(\d{2})", name).group(1): {"watched": value}}
            elif (re.search(r"s\d{2}e", name)):
                if (not contents.get(os.path.basename(os.path.dirname(os.path.dirname(path)))) == None):
                    if (not contents[os.path.basename(os.path.dirname(os.path.dirname(path)))].get(re.search(r"(s\d{2})e\d{2}", name).group(1)) == None):
                        contents[os.path.basename(os.path.dirname(os.path.dirname(path)))][re.search(r"(s\d{2})e\d{2}", name).group(1)][re.search(r"s\d{2}(e\d{2})", name).group(1)] = {"watched": value}
                    else:
                        contents[os.path.basename(os.path.dirname(os.path.dirname(path)))][re.search(r"(s\d{2})e\d{2}", name).group(1)] = {re.search(r"s\d{2}(e\d{2})", name).group(1): {"watched": value}}
                else:
                    contents[os.path.basename(os.path.dirname(os.path.dirname(path)))] = {re.search(r"(s\d{2})e\d{2}", name).group(1): {re.search(r"s\d{2}(e\d{2})", name).group(1): {"watched": value}}}
            else:
                contents[name.replace('`', '')] = {"watched": value}
            with open('./watched_data.ini', 'w') as write_file:
                json.dump(contents, write_file)
                write_file.close()
        else:
            if (re.search(r"season-\d{2}", name)):
                return contents[os.path.basename(os.path.dirname(path))]['s' + re.search(r"season-(\d{2})", name).group(1)]['watched']
            elif (re.search(r"s\d{2}e", name)):
                return contents[os.path.basename(os.path.dirname(os.path.dirname(path)))][re.search(r"(s\d{2})e\d{2}", name).group(1)][re.search(r"s\d{2}(e\d{2})", name).group(1)]['watched']
            else:
                return contents[name]['watched']
        


@eel.expose
def dwnld_metadata(path):
    if (path == 'all'):
        for moviepath in movie_paths:
            all_movies = scan_files(moviepath)

            for movie in all_movies:
                if (os.path.isfile('./web/cached_metadata/' + movie['name'] + '_txt.txt')):
                    saved_metadata_file = open('./web/cached_metadata/' + movie['name'] + '_txt.txt', 'r')
                    saved_metadata = json.loads(saved_metadata_file.read())
                    saved_metadata_file.close()
                    mov_metadata = get_metadata('mov_id', saved_metadata['id'])
                    if (mov_metadata == None):
                        continue
                    json_metadata = "{\"title\": \"" + mov_metadata['original_title'] + "\",\"date\": \"" + mov_metadata['release_date'] + "\",\"id\": \"" + str(mov_metadata['id']) + "\"}"
                    print(json_metadata)
                    with open('./web/cached_metadata/' + movie['name'] + '_txt.txt', 'w') as txt_file:
                        txt_file.write(json_metadata)
                        txt_file.close()
                    if (not mov_metadata['poster_path'] == None):
                        img_data = requests.get('https://image.tmdb.org/t/p/w500' + mov_metadata['poster_path']).content
                        with open('./web/cached_metadata/' + movie['name'] + '_img.jpg', 'wb') as img_file:
                            img_file.write(img_data)
                else:
                    mov_metadata = get_metadata('movie', movie['name'])
                    if (mov_metadata == None):
                        continue
                    json_metadata = "{\"title\": \"" + mov_metadata['original_title'] + "\",\"date\": \"" + mov_metadata['release_date'] + "\",\"id\": \"" + str(mov_metadata['id']) + "\"}"
                    print(json_metadata)
                    with open('./web/cached_metadata/' + movie['name'] + '_txt.txt', 'w') as txt_file:
                        txt_file.write(json_metadata)
                        txt_file.close()
                    if (not mov_metadata['poster_path'] == None):
                        img_data = requests.get('https://image.tmdb.org/t/p/w500' + mov_metadata['poster_path']).content
                        with open('./web/cached_metadata/' + movie['name'] + '_img.jpg', 'wb') as img_file:
                            img_file.write(img_data)

        for showpath in show_paths:
            all_shows = read_dir(showpath)
            
            for show in all_shows:
                if (os.path.isfile('./web/cached_metadata/' + show['name'] + '_txt.txt')):
                    saved_metadata_file = open('./web/cached_metadata/' + show['name'] + '_txt.txt', 'r')
                    saved_metadata = json.loads(saved_metadata_file.read())
                    saved_metadata_file.close()
                    show_metadata = get_metadata('tv_id', saved_metadata['id'])
                    if (show_metadata == None):
                        continue
                    json_metadata = "{\"title\": \"" + show_metadata['original_name'] + "\",\"date\": \"" + show_metadata['first_air_date'] + "\",\"id\": \"" + str(show_metadata['id']) + "\"}"
                    print(json_metadata)
                    with open('./web/cached_metadata/' + show['name'] + '_txt.txt', 'w') as txt_file:
                        txt_file.write(json_metadata)
                        txt_file.close()
                    if (not show_metadata['poster_path'] == None):
                        img_data = requests.get('https://image.tmdb.org/t/p/w500' + show_metadata['poster_path']).content
                        with open('./web/cached_metadata/' + show['name'] + '_img.jpg', 'wb') as img_file:
                            img_file.write(img_data)
                else:
                    show_metadata = get_metadata('tv', show['name'])
                    if (show_metadata == None):
                        continue
                    json_metadata = "{\"title\": \"" + show_metadata['original_name'] + "\",\"date\": \"" + show_metadata['first_air_date'] + "\",\"id\": \"" + str(show_metadata['id']) + "\"}"
                    print(json_metadata)
                    with open('./web/cached_metadata/' + show['name'] + '_txt.txt', 'w') as txt_file:
                        txt_file.write(json_metadata)
                        txt_file.close()
                    if (not show_metadata['poster_path'] == None):
                        img_data = requests.get('https://image.tmdb.org/t/p/w500' + show_metadata['poster_path']).content
                        with open('./web/cached_metadata/' + show['name'] + '_img.jpg', 'wb') as img_file:
                            img_file.write(img_data)
    else:
        if (any(item in path for item in show_paths)):
            all_shows = read_dir(path)
            print(all_shows)
            for show in all_shows:
                if (os.path.isfile('./web/cached_metadata/' + show['name'] + '_txt.txt')):
                    saved_metadata_file = open('./web/cached_metadata/' + show['name'] + '_txt.txt', 'r')
                    saved_metadata = json.loads(saved_metadata_file.read())
                    saved_metadata_file.close()
                    show_metadata = get_metadata('tv_id', saved_metadata['id'])
                    if (show_metadata == None):
                        continue
                    json_metadata = "{\"title\": \"" + show_metadata['original_name'] + "\",\"date\": \"" + show_metadata['first_air_date'] + "\",\"id\": \"" + str(show_metadata['id']) + "\"}"
                    print(json_metadata)
                    with open('./web/cached_metadata/' + show['name'] + '_txt.txt', 'w') as txt_file:
                        txt_file.write(json_metadata)
                        txt_file.close()
                    if (not show_metadata['poster_path'] == None):
                        img_data = requests.get('https://image.tmdb.org/t/p/w500' + show_metadata['poster_path']).content
                        with open('./web/cached_metadata/' + show['name'] + '_img.jpg', 'wb') as img_file:
                            img_file.write(img_data)
                else:
                    show_metadata = get_metadata('tv', show['name'])
                    if (show_metadata == None):
                        continue
                    json_metadata = "{\"title\": \"" + show_metadata['original_name'] + "\",\"date\": \"" + show_metadata['first_air_date'] + "\",\"id\": \"" + str(show_metadata['id']) + "\"}"
                    print(json_metadata)
                    with open('./web/cached_metadata/' + show['name'] + '_txt.txt', 'w') as txt_file:
                        txt_file.write(json_metadata)
                        txt_file.close()
                    if (not show_metadata['poster_path'] == None):
                        img_data = requests.get('https://image.tmdb.org/t/p/w500' + show_metadata['poster_path']).content
                        with open('./web/cached_metadata/' + show['name'] + '_img.jpg', 'wb') as img_file:
                            img_file.write(img_data)
        elif (any(item in path for item in movie_paths)):
            all_movies = scan_files(path)

            for movie in all_movies:
                if (os.path.isfile('./web/cached_metadata/' + movie['name'] + '_txt.txt')):
                    saved_metadata_file = open('./web/cached_metadata/' + movie['name'] + '_txt.txt', 'r')
                    saved_metadata = json.loads(saved_metadata_file.read())
                    saved_metadata_file.close()
                    mov_metadata = get_metadata('mov_id', saved_metadata['id'])
                    if (mov_metadata == None):
                        continue
                    json_metadata = "{\"title\": \"" + mov_metadata['original_title'] + "\",\"date\": \"" + mov_metadata['release_date'] + "\",\"id\": \"" + str(mov_metadata['id']) + "\"}"
                    print(json_metadata)
                    with open('./web/cached_metadata/' + movie['name'] + '_txt.txt', 'w') as txt_file:
                        txt_file.write(json_metadata)
                        txt_file.close()
                    if (not mov_metadata['poster_path'] == None):
                        img_data = requests.get('https://image.tmdb.org/t/p/w500' + mov_metadata['poster_path']).content
                        with open('./web/cached_metadata/' + movie['name'] + '_img.jpg', 'wb') as img_file:
                            img_file.write(img_data)
                else:
                    mov_metadata = get_metadata('movie', movie['name'])
                    if (mov_metadata == None):
                        continue
                    json_metadata = "{\"title\": \"" + mov_metadata['original_title'] + "\",\"date\": \"" + mov_metadata['release_date'] + "\",\"id\": \"" + str(mov_metadata['id']) + "\"}"
                    print(json_metadata)
                    with open('./web/cached_metadata/' + movie['name'] + '_txt.txt', 'w') as txt_file:
                        txt_file.write(json_metadata)
                        txt_file.close()
                    if (not mov_metadata['poster_path'] == None):
                        img_data = requests.get('https://image.tmdb.org/t/p/w500' + mov_metadata['poster_path']).content
                        with open('./web/cached_metadata/' + movie['name'] + '_img.jpg', 'wb') as img_file:
                            img_file.write(img_data)


def get_playlist():
    media_files = []
    cur_playing_media = media_player.get_media().get_mrl()
    for i in range(playlist.count()):
        media = playlist.item_at_index(i)
        if (media.get_mrl() == cur_playing_media):
            is_playing = True
        else:
            is_playing = False
        media_info = {
            'name': os.path.splitext(media.get_meta(vlc.Meta.Title))[0],
            'path': media.get_mrl(),
            'isPlaying': is_playing
        }
        print(is_playing)
        media_files.append(media_info)
    return media_files

@eel.expose
def save_playlist(holder, name, holder2, location):
    eel.closeBrowseDialog('browse_dialog')
    with open(location + '/' + name + '.lst', 'w') as plylst_file:
        plylst_file.write(json.dumps(get_playlist()))
        plylst_file.close()

def clear_playlist():
    global playlist
    playlist = vlc_inst.media_list_new()
    media_list_player.set_media_list(playlist)

@eel.expose
def read_music_files(path):
    return read_dir(path)

@eel.expose
def get_drives():
    items = []
    if (platform == 'win32'):
        drives = win32api.GetLogicalDriveStrings().split('\000')[:-1]
    elif (platform == 'linux'):
        drives = ['/']
    for entry in drives:
        folder_item = {
            'name': entry,
            'type': 'folder',
            'path': entry
        }
        items.append(folder_item)
    return items

@eel.expose
def pause():
    player_state = media_player.get_state()
    if (player_state == vlc.State.Playing):
        media_list_player.pause()
        eel.drawPlayBtn('pause')
    else:
        media_list_player.play()
        eel.drawPlayBtn('play')

@eel.expose
def stop():
    global radio_playing
    global radio_stations
    if radio_playing[0]:
        radio_stations[radio_playing[1]]['time'] = round(media_player.get_time()/1000)
        radio_stations[radio_playing[1]]['fileAt'] = playlist.index_of_item(media_player.get_media())
        path = media_player.get_media().get_mrl().replace('%20', ' ').replace('%21', '!').replace(vlc_prefix, '')
        radio_stations[radio_playing[1]]['length'] = round(AudioFileClip(path).duration)
        save_stations()
        radio_playing[0] = False
    media_list_player.stop()
    expand_gui()
    eel.drawPlayBtn('pause')
    mainRenderUpdate()

@eel.expose
def skip_next():
    media_list_player.next()

@eel.expose
def skip_prev():
    media_list_player.previous()

@eel.expose
def toggle_loop():
    #media_list_player.set_playback_mode(vlc.PlaybackMode.default)
    media_list_player.set_playback_mode(vlc.PlaybackMode.loop)
    #media_list_player.set_playback_mode(vlc.PlaybackMode.repeat)

def mainRenderUpdate(event=None):
    global video_open
    global video_window
    path = media_player.get_media().get_mrl().replace('file://', '').replace('%20', ' ').replace('\\', '/')
    print('path: ' + path)
    player_state = media_player.get_state()
    if ((any(item in path for item in show_paths) or any(item in path for item in movie_paths)) and
    not player_state == vlc.State.Ended and not player_state == vlc.State.Stopped):
        print('is movie or show')
        video_open = True
        shrink_gui()
        if (platform == 'win32'):
            # disable turning the screen off
            windll.kernel32.SetThreadExecutionState(0x80000002)
            media_player.set_fullscreen(False)
            eel.sleep(2)
            video_window = pwc.getWindowsWithTitle('VLC (Direct3D11 output)')[0]
        elif (platform == 'linux'):
            media_player.set_fullscreen(False)
            eel.sleep(2)
            video_window = pwc.getWindowsWithTitle('VLC media player')[0]
        move_vlc_window()
    else:
        video_open = False
        if (platform == 'win32'):
            # enable turning the screen off
            windll.kernel32.SetThreadExecutionState(0x80000000)
            windll.user32.ShowWindow(windll.user32.FindWindowA(b'Shell_TrayWnd', None), 9)

    eel.drawPlaylist(get_playlist())

def renderProgressBar(event):
    len = str(datetime.timedelta(milliseconds=media_player.get_length()))[:-7]
    pos = round(media_player.get_position() * 100, 3)
    time = str(datetime.timedelta(milliseconds=media_player.get_time()))[:-7]
    eel.renderProgress(len, pos, time)

def fileFinished(event):
    expand_gui()
    eel.drawPlayBtn('pause')
    path = media_player.get_media().get_mrl().replace('file://', '').replace('%20', ' ').replace('\\', '/')
    print(path)
    handle_watched_data(path, True)

vlc_event_manager = media_player.event_manager()
vlc_event_manager.event_attach(vlc.EventType.MediaPlayerMediaChanged, mainRenderUpdate)
vlc_event_manager.event_attach(vlc.EventType.MediaPlayerTimeChanged, renderProgressBar)
vlc_event_manager.event_attach(vlc.EventType.MediaPlayerEndReached, fileFinished)

@eel.expose
def play_folder(path, shuffle=False):
    media_list_player.stop()
    clear_playlist()
    if shuffle:
        files_list = [entry for entry in os.scandir(path) if entry.is_file()]
        random.shuffle(files_list)
        for file in files_list:
            playlist.add_media(vlc_inst.media_new(file.path))
    else:
        for file in sorted(os.scandir(path), key=lambda e: (not e.is_dir(), e.name)):
            if file.is_file():
                playlist.add_media(vlc_inst.media_new(file.path))
    media_list_player.play()
    eel.drawPlayBtn('play')
    #if (any(item in path for item in show_paths) or any(item in path for item in movie_paths)):
    #    video_window = pwc.getWindowsWithTitle('VLC (Direct3D11 output)')[0]
    mainRenderUpdate()

@eel.expose
def enqueue_folder(path):
    for file in sorted(os.scandir(path), key=lambda e: (not e.is_dir(), e.name)):
        if file.is_file():
            playlist.add_media(vlc_inst.media_new(file.path))
    mainRenderUpdate()

@eel.expose
def play_file(path, time = None, list_pos = None):
    media_list_player.stop()
    clear_playlist()
    if (path.endswith('.lst')):
        plylst_file = open(path, 'r')
        contents = plylst_file.read()
        plylst_file.close()
        data = json.loads(contents)
        print(data)
        for file in data:
            playlist.add_media(vlc_inst.media_new(file['path']))
    else:
        playlist.add_media(vlc_inst.media_new(path))
    eel.drawPlayBtn('play')
    media_list_player.play()
    if not time == None:
        media_list_player.play_item_at_index(list_pos)
        media_player.set_time(time * 1000)
    eel.sleep(1)
    get_subs()
    get_audios()
    #if (any(item in path for item in show_paths) or any(item in path for item in movie_paths)):
    #    eel.sleep(1)
    #    video_window = pwc.getWindowsWithTitle('VLC (Direct3D11 output)')[0]
    mainRenderUpdate()

@eel.expose
def enqueue_file(path):
    if (path.endswith('.lst')):
        plylst_file = open(path, 'r')
        contents = plylst_file.read()
        plylst_file.close()
        data = json.loads(contents)
        print(data)
        for file in data:
            playlist.add_media(vlc_inst.media_new(file['path']))
    else:
        playlist.add_media(vlc_inst.media_new(path))
    media_list_player.play()
    mainRenderUpdate()

@eel.expose
def remove_file(index):
    playlist.remove_index(index)
    mainRenderUpdate()

eel.init('web')
eel.start('index.html')