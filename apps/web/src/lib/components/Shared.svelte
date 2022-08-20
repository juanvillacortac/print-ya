<script>
  import { shared } from './store'

  $: if (shared) alert('Funciona')
</script>
