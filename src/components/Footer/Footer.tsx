import React from 'react'
import { MENU_ITEM } from '../../Constants/Constants'

export default function Footer() {
  return (
    <footer className="bg-muted text-foreground py-12 border-t">
    <div className="container max-w-5xl px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="flex flex-col items-start gap-4">
        <a href="#" className="flex items-center gap-2">
        <p className="font-extrabold text-2xl p-4 w-25 self-center">
        [CWS]
      </p>
        </a>
        <p className="text-muted-foreground text-left max-w-md font-second">
            Cicero Web Studio is a web design and development agency based in
            Chicago, IL. We specialize in helping small businesses thrive in the
            digital landscape.
        </p>
      </div>
      <div className="grid gap-2 text-center">
        <h4 className="text-2xl font-semibold font-cyan-900">Menu</h4>
        {MENU_ITEM.map((nav, index) => (
          <a href={nav.url} key={index} className={nav.class}>
            {nav.name}
          </a>
        ))}
      </div>
      <div className="grid gap-2">
        <h4 className="text-lg font-semibold">Contact</h4>
        <p className="text-muted-foreground">Phone: (786) 314-6121</p>
        <p className="text-muted-foreground">
        info@cicerowebstudio.xyz
        </p>
      </div>
    </div>
    <div className="container max-w-5xl px-4 md:px-6 mt-8 flex justify-between items-center text-xs text-muted-foreground">
      <p>&copy; 2025 Cicero Web Studio </p>
      <nav className="flex gap-4">
        <a
          href="https://tuliosalvatierra.com/"
          target="_blank"
          className="hover:text-foreground"
        >
          coded by <span className="font-semibold">Tulio Salvatierra</span>
        </a>
      </nav>
    </div>
  </footer>
  )
}

