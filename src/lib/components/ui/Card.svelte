<script lang="ts">
   interface Props {
       children?: import('svelte').Snippet;
       class?: string;
       onclick?: () => void;
   }

   let { children, class: className = '', onclick }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md {onclick ? 'cursor-pointer active:scale-[0.98]' : ''} {className}"
    {onclick}
>
    {@render children?.()}
</div>
