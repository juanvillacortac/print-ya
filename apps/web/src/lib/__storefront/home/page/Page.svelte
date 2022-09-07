<script>
  import Image from '$lib/components/caravaggio/Image.svelte'
  import { layoutData } from '$lib'
  import { UserAvatarFilled32 } from 'carbon-icons-svelte'
</script>

<div class="flex flex-col space-y-12 pb-12">
  <div class="flex-col flex mx-auto space-y-6 lg:px-4 lg:w-9/10">
    <Image
      lazy
      src="https://cdn.shopify.com/s/files/1/0263/8249/9885/files/shop_2048x.progressive.jpg?v=1570913752-"
      width="1410"
      height="768"
      options={{
        progressive: true,
        q: 70,
        o: 'auto',
        rs: {
          s: '1410x768',
          m: 'scale',
        },
      }}
    />
  </div>

  <div class="flex-col flex mx-auto space-y-12 px-4 items-center lg:w-9/10">
    <h3 class="text-center text-2xl uppercase lg:text-4xl">
      View our vinyl decal collection
    </h3>
    <div class="w-full grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {#each $layoutData.store?.categories || [] as c}
        <a
          href="/products?category={encodeURIComponent(c.name)}"
          class="flex flex-col space-y-4 duration-200 hover:text-red-500"
          data-sveltekit-prefetch
        >
          <div
            class="bg-black flex font-bold font-title text-white text-center w-full p-6 text-3xl aspect-square items-center justify-center"
          >
            {c.name}
          </div>
          <div class="font-bold text-center">{c.name}</div>
        </a>
      {/each}
    </div>
  </div>

  <div
    class="mx-auto w-full grid px-4 gap-8 items-center lg:w-9/10 lg:grid-cols-2"
  >
    <Image
      src="https://cdn.shopify.com/s/files/1/0263/8249/9885/files/Office-Wall-decal_1024x1024.jpg?v=1571321829"
      width="1410"
      height="768"
      lazy
      class="rounded border-gray-300"
      options={{
        progressive: true,
        q: 70,
        o: 'auto',
        rs: {
          s: '1410x768',
          m: 'scale',
        },
      }}
    />
    <div class="flex flex-col space-y-4 w-full">
      <h3 class="text-xl">
        We constantly reinvest in our company to offer the best quality sticker
        materials and printing technology for you!
      </h3>
      <p class="font-bold text-sm">
        Die Cut Vinyl is wonderful for single color logos or for large word
        cutouts. It sticks to almost every surface including vehicles, glass,
        most plastics, metal, boats and more! We use nothing but premium vinyl
        in order to have a long lasting product.
      </p>
    </div>
  </div>

  <div class="flex-col flex mx-auto space-y-12 px-4 items-center lg:w-9/10">
    <h3 class="text-center text-black text-2xl lg:text-4xl dark:text-white">
      Vinyl decals are an effective and economical way to jazz up the exterior
      of your storefront, boat or car
    </h3>
    <div class="w-full grid gap-6 sm:grid-cols-3">
      <div class="flex lg:space-x-2 <lg:flex-col <lg:space-y-2">
        <UserAvatarFilled32
          class="min-h-84px min-w-84px text-gray-400 dark:text-gray-600"
        />
        <div class="flex flex-col space-y-8">
          <p class="font-light italic">
            <span class="font-serif font-bold text-$sc-color-primary text-5xl"
              >&ldquo;</span
            >
            <span>
              I'm very happy with the decals. I've had them for a few months,
              but waited for warmer weather to put them on. They were very easy
              to apply, the toughest part was deciding exactly where to put
              them. They look great on my Jeep.
            </span>
            <!-- <span class="font-serif font-bold text-$sc-color-primary text-4xl inline-flex"
              >&ldquor;</span
            > -->
          </p>
          <div class="text-$sc-color-primary">Bri the Jeep Guy</div>
        </div>
      </div>
      <div class="flex lg:space-x-2 <lg:flex-col <lg:space-y-2">
        <UserAvatarFilled32
          class="min-h-84px min-w-84px text-gray-400 dark:text-gray-600"
        />
        <div class="flex flex-col space-y-8">
          <p class="font-light italic">
            <span class="font-serif font-bold text-$sc-color-primary text-5xl"
              >&ldquo;</span
            >
            <span>
              Excellent quality of the actual decal. The application method is
              easy and allows the "free floating" maple leave not to move while
              applying. It's stuck on well to my truck window however I could
              scrape it off if I wanted to. Waterproof So far and weather proof.
              Had it on up to +30°C above 0 and now it is -30°C below 0!
            </span>
            <!-- <span class="font-serif font-bold text-$sc-color-primary text-4xl inline-flex"
              >&ldquor;</span
            > -->
          </p>
          <div class="text-$sc-color-primary">NorthernCanuck</div>
        </div>
      </div>
      <div class="flex lg:space-x-2 <lg:flex-col <lg:space-y-2">
        <UserAvatarFilled32
          class="min-h-84px min-w-84px text-gray-400 dark:text-gray-600"
        />
        <div class="flex flex-col space-y-8">
          <p class="font-light italic">
            <span class="font-serif font-bold text-$sc-color-primary text-5xl"
              >&ldquo;</span
            >
            <span> Trè facile à l appliquer! </span>
            <!-- <span class="font-serif font-bold text-$sc-color-primary text-4xl inline-flex"
              >&ldquor;</span
            > -->
          </p>
          <div class="text-$sc-color-primary">Steve R.</div>
        </div>
      </div>
    </div>
  </div>
</div>
