<script>
  import { pageSubtitle } from '$lib'
  import SearchHistoryList from '$lib/__app/SearchHistoryList.svelte'

  $pageSubtitle = 'Search history'
</script>

<h2 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
  Search history
</h2>

<SearchHistoryList />
