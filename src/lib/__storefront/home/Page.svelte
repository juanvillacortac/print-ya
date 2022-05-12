<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import { get } from '$lib/api'

  export const load: Load = async ({ fetch, stuff }) => {
    const data = await get<StripedProduct[]>(
      `/api/stores/${stuff.store?.slug}/products`,
      { fetch }
    )
    return {
      props: {
        data: {
          products: data.filter((p) => p.public),
        },
      },
    }
  }
</script>

<script lang="ts">
  import type { StripedProduct } from '$lib/db'
  import HomeIntro from '$lib/__storefront/home/HomeIntro.svelte'
  import { Viewport } from '$lib'

  export let data: any

  $: products = data.products as StripedProduct[]
</script>

<HomeIntro {products} />

<!-- <div
  class="bg-cover bg-center flex flex-col space-y-4 bg-gray-900 text-white w-full py-24 items-center justify-center dark:bg-gray-800"
  style="background-image: url(https://c.tenor.com/CN76hxiOTPsAAAAC/space-warp-expressions.gif)"
>
  <Viewport
    oneWay
    --a-y="-0.8rem"
    class="flex flex-col space-y-2 p-6 items-center justify-center !text-center"
  >
    <p class="font-title font-bold text-2xl anim lg:text-4xl">
      Do you need to print something?
    </p>
    <p
      class="font-title font-bold text-md anim lg:text-xl"
      style:--anim-d="0.4s"
    >
      We can bring your idea to reality, <i>fast</i>!
    </p>
  </Viewport>
</div> -->
