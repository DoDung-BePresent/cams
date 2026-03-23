src/features/admin/pages/PlaylistManagement/components/PlaylistFilter.tsx:52:12 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistFilter'.

52 filter.isDynamic !== undefined ||
~~~~~~~~~

src/features/admin/pages/PlaylistManagement/components/PlaylistFilter.tsx:148:29 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistFilter'.

148 value={filter.isDynamic}
~~~~~~~~~

src/features/admin/pages/PlaylistManagement/components/PlaylistFilter.tsx:149:51 - error TS2345: Argument of type '"isDynamic"' is not assignable to parameter of type 'keyof PlaylistFilter'.

149 onChange={(value) => onFilterChange('isDynamic', value)}
~~~~~~~~~~~

src/features/admin/pages/PlaylistManagement/components/PlaylistFilter.tsx:202:19 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistFilter'.

202 {filter.isDynamic !== undefined && (
~~~~~~~~~

src/features/admin/pages/PlaylistManagement/components/PlaylistFilter.tsx:205:45 - error TS2345: Argument of type '"isDynamic"' is not assignable to parameter of type 'keyof PlaylistFilter'.

205 onClose={() => onFilterChange('isDynamic', undefined)}
~~~~~~~~~~~

src/features/admin/pages/PlaylistManagement/components/PlaylistFilter.tsx:207:29 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistFilter'.

207 Type: {filter.isDynamic ? 'Dynamic' : 'Static'}
~~~~~~~~~

src/features/admin/pages/TrackManagement/components/TrackDetailsDrawer.tsx:87:29 - error TS2339: Property 'audioUrl' does not exist on type 'TrackDetailResponse'.

87 audioUrl={track.audioUrl}
~~~~~~~~

src/features/brand/pages/PlaylistManagement/components/CreatePlaylistDrawer.tsx:70:9 - error TS2353: Object literal may only specify known properties, and 'isDynamic' does not exist in type '{ name?: string | undefined; storeId?: string | undefined; moodId?: string | undefined; description?: string | undefined; isDefault?: boolean | undefined; trackIds?: string[] | undefined; }'.

70 isDynamic: false,
~~~~~~~~~

src/features/brand/pages/PlaylistManagement/components/EditPlaylistDrawer.tsx:73:9 - error TS2353: Object literal may only specify known properties, and 'isDynamic' does not exist in type '{ name?: string | undefined; moodId?: string | undefined; description?: string | undefined; isDefault?: boolean | undefined; trackIds?: string[] | undefined; }'.

73 isDynamic: playlist.isDynamic,
~~~~~~~~~

src/features/brand/pages/PlaylistManagement/components/EditPlaylistDrawer.tsx:73:29 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistDetailResponse'.

73 isDynamic: playlist.isDynamic,
~~~~~~~~~

src/features/brand/pages/PlaylistManagement/components/EditPlaylistDrawer.tsx:75:26 - error TS2339: Property 'hlsUrl' does not exist on type 'PlaylistDetailResponse'.

75 hlsUrl: playlist.hlsUrl || undefined,
~~~~~~

src/features/brand/pages/PlaylistManagement/components/EditPlaylistDrawer.tsx:76:40 - error TS2339: Property 'totalDurationSeconds' does not exist on type 'PlaylistDetailResponse'.

76 totalDurationSeconds: playlist.totalDurationSeconds || undefined,
~~~~~~~~~~~~~~~~~~~~

src/features/brand/pages/PlaylistManagement/components/PlaylistFilter.tsx:51:12 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistFilter'.

51 filter.isDynamic !== undefined ||
~~~~~~~~~

src/features/brand/pages/PlaylistManagement/components/PlaylistFilter.tsx:137:29 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistFilter'.

137 value={filter.isDynamic}
~~~~~~~~~

src/features/brand/pages/PlaylistManagement/components/PlaylistFilter.tsx:138:51 - error TS2345: Argument of type '"isDynamic"' is not assignable to parameter of type 'keyof PlaylistFilter'.

138 onChange={(value) => onFilterChange('isDynamic', value)}
~~~~~~~~~~~

src/features/brand/pages/PlaylistManagement/components/PlaylistFilter.tsx:191:19 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistFilter'.

191 {filter.isDynamic !== undefined && (
~~~~~~~~~

src/features/brand/pages/PlaylistManagement/components/PlaylistFilter.tsx:194:45 - error TS2345: Argument of type '"isDynamic"' is not assignable to parameter of type 'keyof PlaylistFilter'.

194 onClose={() => onFilterChange('isDynamic', undefined)}
~~~~~~~~~~~

src/features/brand/pages/PlaylistManagement/components/PlaylistFilter.tsx:196:29 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistFilter'.

196 Type: {filter.isDynamic ? 'Dynamic' : 'Static'}
~~~~~~~~~

src/features/brand/pages/PlaylistManagement/PlaylistList.tsx:32:3 - error TS2305: Module '"@/shared/modules/playlists/hooks"' has no exported member 'useRetranscodePlaylist'.

32 useRetranscodePlaylist,
~~~~~~~~~~~~~~~~~~~~~~

src/features/brand/pages/TrackManagement/components/EditTrackDrawer.tsx:192:19 - error TS2339: Property 'audioUrl' does not exist on type 'TrackDetailResponse'.

192 {track?.audioUrl && (
~~~~~~~~

src/features/brand/pages/TrackManagement/components/EditTrackDrawer.tsx:201:33 - error TS2339: Property 'audioUrl' does not exist on type 'TrackDetailResponse'.

201 audioUrl={track.audioUrl}
~~~~~~~~

src/features/brand/pages/TrackManagement/components/TrackDetailsDrawer.tsx:80:18 - error TS2339: Property 'audioUrl' does not exist on type 'TrackDetailResponse'.

80 {track.audioUrl && (
~~~~~~~~

src/features/brand/pages/TrackManagement/components/TrackDetailsDrawer.tsx:89:33 - error TS2339: Property 'audioUrl' does not exist on type 'TrackDetailResponse'.

89 audioUrl={track.audioUrl}
~~~~~~~~

src/features/store/pages/PlaylistManagement/components/CreatePlaylistDrawer.tsx:64:9 - error TS2353: Object literal may only specify known properties, and 'isDynamic' does not exist in type '{ name?: string | undefined; storeId?: string | undefined; moodId?: string | undefined; description?: string | undefined; isDefault?: boolean | undefined; trackIds?: string[] | undefined; }'.

64 isDynamic: false,
~~~~~~~~~

src/features/store/pages/PlaylistManagement/components/EditPlaylistDrawer.tsx:73:9 - error TS2353: Object literal may only specify known properties, and 'isDynamic' does not exist in type '{ name?: string | undefined; moodId?: string | undefined; description?: string | undefined; isDefault?: boolean | undefined; trackIds?: string[] | undefined; }'.

73 isDynamic: playlist.isDynamic,
~~~~~~~~~

src/features/store/pages/PlaylistManagement/components/EditPlaylistDrawer.tsx:73:29 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistDetailResponse'.

73 isDynamic: playlist.isDynamic,
~~~~~~~~~

src/features/store/pages/PlaylistManagement/components/EditPlaylistDrawer.tsx:75:26 - error TS2339: Property 'hlsUrl' does not exist on type 'PlaylistDetailResponse'.

75 hlsUrl: playlist.hlsUrl || undefined,
~~~~~~

src/features/store/pages/PlaylistManagement/components/EditPlaylistDrawer.tsx:76:40 - error TS2339: Property 'totalDurationSeconds' does not exist on type 'PlaylistDetailResponse'.

76 totalDurationSeconds: playlist.totalDurationSeconds || undefined,
~~~~~~~~~~~~~~~~~~~~

src/features/store/pages/PlaylistManagement/components/PlaylistFilter.tsx:48:12 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistFilter'.

48 filter.isDynamic !== undefined ||
~~~~~~~~~

src/features/store/pages/PlaylistManagement/components/PlaylistFilter.tsx:121:29 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistFilter'.

121 value={filter.isDynamic}
~~~~~~~~~

src/features/store/pages/PlaylistManagement/components/PlaylistFilter.tsx:122:51 - error TS2345: Argument of type '"isDynamic"' is not assignable to parameter of type 'keyof PlaylistFilter'.

122 onChange={(value) => onFilterChange('isDynamic', value)}
~~~~~~~~~~~

src/features/store/pages/PlaylistManagement/components/PlaylistFilter.tsx:167:19 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistFilter'.

167 {filter.isDynamic !== undefined && (
~~~~~~~~~

src/features/store/pages/PlaylistManagement/components/PlaylistFilter.tsx:170:45 - error TS2345: Argument of type '"isDynamic"' is not assignable to parameter of type 'keyof PlaylistFilter'.

170 onClose={() => onFilterChange('isDynamic', undefined)}
~~~~~~~~~~~

src/features/store/pages/PlaylistManagement/components/PlaylistFilter.tsx:172:29 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistFilter'.

172 Type: {filter.isDynamic ? 'Dynamic' : 'Static'}
~~~~~~~~~

src/features/store/pages/PlaylistManagement/PlaylistList.tsx:32:3 - error TS2305: Module '"@/shared/modules/playlists/hooks"' has no exported member 'useRetranscodePlaylist'.

32 useRetranscodePlaylist,
~~~~~~~~~~~~~~~~~~~~~~

src/features/store/pages/SpaceManagement/components/SpaceDetailDrawer.tsx:159:31 - error TS2339: Property 'currentPlaylistId' does not exist on type 'SpaceStateResponse'.

159 !!spaceState?.currentPlaylistId,
~~~~~~~~~~~~~~~~~

src/features/store/pages/SpaceManagement/components/SpaceDetailDrawer.tsx:163:28 - error TS2339: Property 'currentPlaylistName' does not exist on type 'SpaceStateResponse'.

163 {spaceState?.currentPlaylistName ? (
~~~~~~~~~~~~~~~~~~~

src/features/store/pages/SpaceManagement/components/SpaceDetailDrawer.tsx:164:47 - error TS2339: Property 'currentPlaylistName' does not exist on type 'SpaceStateResponse'.

164 <Tag color='blue'>{spaceState.currentPlaylistName}</Tag>
~~~~~~~~~~~~~~~~~~~

src/features/store/pages/SpaceManagement/components/SpaceDetailDrawer.tsx:199:26 - error TS2339: Property 'pendingPlaylistId' does not exist on type 'SpaceStateResponse'.

199 {spaceState?.pendingPlaylistId && (
~~~~~~~~~~~~~~~~~

src/features/store/pages/SpaceManagement/components/SpaceDetailDrawer.tsx:203:36 - error TS2339: Property 'pendingPlaylistId' does not exist on type 'SpaceStateResponse'.

203 text={spaceState.pendingPlaylistId}
~~~~~~~~~~~~~~~~~

src/features/store/pages/SpaceManagement/components/SpacePlayerCard.tsx:61:37 - error TS2339: Property 'currentPlaylistId' does not exist on type 'SpaceStateResponse'.

61 const hasPlaylist = !!spaceState?.currentPlaylistId;
~~~~~~~~~~~~~~~~~

src/features/store/pages/SpaceManagement/components/SpacePlayerCard.tsx:62:35 - error TS2339: Property 'pendingPlaylistId' does not exist on type 'SpaceStateResponse'.

62 const isPending = !!spaceState?.pendingPlaylistId;
~~~~~~~~~~~~~~~~~

src/features/store/pages/SpaceManagement/components/SpacePlayerCard.tsx:178:36 - error TS2339: Property 'currentPlaylistId' does not exist on type 'SpaceStateResponse'.

178 value={spaceState?.currentPlaylistId || undefined}
~~~~~~~~~~~~~~~~~

src/features/store/pages/SpaceManagement/components/SpacePlayerCard.tsx:187:28 - error TS2339: Property 'currentPlaylistName' does not exist on type 'SpaceStateResponse'.

187 {spaceState?.currentPlaylistName && (
~~~~~~~~~~~~~~~~~~~

src/features/store/pages/SpaceManagement/components/SpacePlayerCard.tsx:192:40 - error TS2339: Property 'currentPlaylistName' does not exist on type 'SpaceStateResponse'.

192 Current: {spaceState.currentPlaylistName}
~~~~~~~~~~~~~~~~~~~

src/features/store/pages/TrackManagement/components/TrackDetailsDrawer.tsx:87:29 - error TS2339: Property 'audioUrl' does not exist on type 'TrackDetailResponse'.

87 audioUrl={track.audioUrl}
~~~~~~~~

src/shared/modules/cams/components/SpacePlayer.tsx:372:23 - error TS2339: Property 'currentPlaylistName' does not exist on type 'SpaceStateResponse'.

372 {state?.currentPlaylistName || 'No playlist playing'}
~~~~~~~~~~~~~~~~~~~

src/shared/modules/cams/components/SpacePlayer.tsx:437:31 - error TS2339: Property 'currentPlaylistId' does not exist on type 'SpaceStateResponse'.

437 disabled={!state?.currentPlaylistId || isLoading}
~~~~~~~~~~~~~~~~~

src/shared/modules/cams/components/SpacePlayer.tsx:460:31 - error TS2339: Property 'currentPlaylistId' does not exist on type 'SpaceStateResponse'.

460 disabled={!state?.currentPlaylistId || isLoading}
~~~~~~~~~~~~~~~~~

src/shared/modules/cams/constants/camsConstants.ts:17:14 - error TS2741: Property '[PlaybackCommand.TrackEnded]' is missing in type '{ 1: string; 2: string; 3: string; 4: string; 5: string; 6: string; 7: string; 8: string; }' but required in type 'Record<PlaybackCommand, string>'.

17 export const PLAYBACK_COMMAND_LABELS: Record<PlaybackCommand, string> = {
~~~~~~~~~~~~~~~~~~~~~~~

src/shared/modules/playlists/components/PlaylistDetailsDrawer.tsx:126:57 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistDetailResponse'.

126 <Tag color={PLAYLIST_TYPE_COLORS[playlist.isDynamic ? 1 : 0]}>
~~~~~~~~~

src/shared/modules/playlists/components/PlaylistDetailsDrawer.tsx:127:48 - error TS2339: Property 'isDynamic' does not exist on type 'PlaylistDetailResponse'.

127 {PLAYLIST_TYPE_LABELS[playlist.isDynamic ? 1 : 0]}
~~~~~~~~~

src/shared/modules/playlists/components/PlaylistDetailsDrawer.tsx:171:25 - error TS2339: Property 'totalDurationSeconds' does not exist on type 'PlaylistDetailResponse'.

171 {playlist.totalDurationSeconds
~~~~~~~~~~~~~~~~~~~~

src/shared/modules/playlists/components/PlaylistDetailsDrawer.tsx:172:43 - error TS2339: Property 'totalDurationSeconds' does not exist on type 'PlaylistDetailResponse'.

172 ? formatDuration(playlist.totalDurationSeconds)
~~~~~~~~~~~~~~~~~~~~

src/shared/modules/playlists/components/PlaylistDetailsDrawer.tsx:178:21 - error TS2339: Property 'hlsUrl' does not exist on type 'PlaylistDetailResponse'.

178 {playlist.hlsUrl && (
~~~~~~

src/shared/modules/playlists/components/PlaylistDetailsDrawer.tsx:186:34 - error TS2339: Property 'hlsUrl' does not exist on type 'PlaylistDetailResponse'.

186 href={playlist.hlsUrl}
~~~~~~

src/shared/modules/playlists/components/PlaylistDetailsDrawer.tsx:190:29 - error TS2339: Property 'hlsUrl' does not exist on type 'PlaylistDetailResponse'.

190 {playlist.hlsUrl}
~~~~~~

Found 57 errors.

husky - pre-push script failed (code 2)
error: failed to push some refs to 'https://github.com/DoDung-BePresent/cams.git'
