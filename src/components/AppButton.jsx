export default function AppButton({ children, variant = 'primary', loading = false, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark active:scale-95 px-5 py-3 text-sm',
    secondary: 'bg-lavender-soft text-primary hover:bg-purple-100 px-5 py-3 text-sm',
    ghost: 'text-primary hover:bg-primary/10 px-4 py-2 text-sm',
    danger: 'bg-red-500 text-white hover:bg-red-600 px-5 py-3 text-sm',
    outline: 'border border-primary text-primary hover:bg-primary/10 px-5 py-3 text-sm',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  )
}
