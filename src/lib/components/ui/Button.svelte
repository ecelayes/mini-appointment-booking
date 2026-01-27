<script lang="ts">
   interface Props {
       children?: import('svelte').Snippet;
       variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
       type?: 'button' | 'submit' | 'reset';
       fullWidth?: boolean;
       disabled?: boolean;
       onclick?: (event: MouseEvent) => void;
       class?: string;
   }

   let { 
       children, 
       variant = 'primary', 
       type = 'button', 
       fullWidth = false, 
       disabled = false,
       onclick,
       class: className = '' 
   }: Props = $props();

   const baseStyles = "cursor-pointer inline-flex items-center justify-center rounded-xl px-4 py-3 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 select-none";
   
   const variants = {
       primary: "bg-[#597dff] text-white hover:bg-blue-600 focus:ring-blue-500",
       secondary: "bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-200",
       outline: "border-2 border-slate-200 bg-transparent hover:bg-slate-50 text-slate-900",
       ghost: "bg-transparent hover:bg-slate-100 text-slate-700"
   };

   let widthClass = $derived(fullWidth ? 'w-full' : '');
</script>

<button
    {type}
    class="{baseStyles} {variants[variant]} {widthClass} {className}"
    {disabled}
    {onclick}
>
    {@render children?.()}
</button>
