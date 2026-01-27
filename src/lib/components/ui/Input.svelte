<script lang="ts">
    interface Props {
        value: string;
        type?: string;
        placeholder?: string;
        label?: string;
        id?: string;
        required?: boolean;
        class?: string;
        oninput?: (event: Event) => void;
    }

    let { 
        value = $bindable(), 
        type = 'text', 
        placeholder = '', 
        label, 
        id, 
        required = false,
        class: className = '',
        oninput
    }: Props = $props();
</script>

<div class="flex flex-col gap-1.5 {className}">
    {#if label}
        <label for={id} class="text-sm font-medium text-gray-700 ml-1">
            {label}
        </label>
    {/if}
    <input
        {id}
        {type}
        bind:value
        {placeholder}
        {required}
        {oninput}
        class="flex h-12 w-full rounded-xl border-none bg-gray-100 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
    />
</div>
