interface NavbarProps {
  onCreateMate?: () => void
}

export function Navbar({ onCreateMate }: NavbarProps = {}) {
  return (
    <nav className="navbar" role="navigation" aria-label="Navegación principal">
      <div className="navbar-inner">
        <a href="/" className="navbar-logo" aria-label="MATESHOP - Inicio">
          <span className="logo-main">MATESHOP</span>
        </a>
        <div className="navbar-links">
          <button
            className="navbar-cta"
            onClick={onCreateMate}
            aria-label="Crear mi virola personalizada"
          >
            CREAR MI VIROLA
          </button>
        </div>
      </div>
    </nav>
  )
}
