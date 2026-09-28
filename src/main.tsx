import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { palette } from './config/brand'
import './styles/global.css'
import './styles/workshop.css'
import './styles/entrance.css'
import './styles/clay.css'
import './styles/twist.css'
import './styles/reveal.css'
import './styles/shaping.css'
import './styles/kiln.css'
import './styles/collection.css'
import { WorkshopProvider } from './state/WorkshopProvider'

Object.entries(palette).forEach(([name, value]) => {
  document.documentElement.style.setProperty(`--color-${name}`, value)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><WorkshopProvider><App /></WorkshopProvider></React.StrictMode>,
)
