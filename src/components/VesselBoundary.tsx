import {Component,type ReactNode} from 'react'
import {VesselLoading} from './VesselLoading'
/** Preserve the saved work if the lazy JS chunk fails on a weak connection. */
export class VesselBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false}
 static getDerivedStateFromError(){return{failed:true}}
 render(){return this.state.failed?<><VesselLoading/><div className="vessel-load-error" role="alert"><p>立体工作台暂时没有加载出来，你的纹已保留。</p><button onClick={()=>window.location.reload()}>重新加载工作台</button></div></>:this.props.children}
}
