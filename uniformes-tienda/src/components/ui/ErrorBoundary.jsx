import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  render() {
    if (this.state.crashed) {
      return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:"16px", fontFamily:"sans-serif", padding:"24px", textAlign:"center" }}>
          <p style={{ fontSize:"1.1rem", color:"#444" }}>Algo salió mal. Por favor recarga la página.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding:"10px 24px", background:"#1c1c1c", color:"#fff", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"1rem" }}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
