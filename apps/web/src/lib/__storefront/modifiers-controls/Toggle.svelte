<script lang="ts">
  import type { ModifierValue } from '@shackcart/db'

  export let value: ModifierValue
  export const items = undefined
  export let disabled = false
</script>

<input
  type="checkbox"
  {disabled}
  bind:checked={value.value}
  class="justify-start"
/>
