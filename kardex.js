"use strict";
function saldoDe(estado,id){return estado.movimientos.filter(x=>x.materialId===id).reduce((s,x)=>s+(x.tipo==="ENTRADA"?x.cantidad:-x.cantidad),0);}
function agregarMovimiento(estado,id,tipo,cantidad,uid,fecha){
 const material=estado.materiales.find(x=>x.id===id&&x.activo);
 if(!material)throw Error("Seleccione un material activo.");
 if(!["ENTRADA","SALIDA"].includes(tipo)||!Number.isSafeInteger(cantidad)||cantidad<=0)throw Error("Cantidad: entero positivo.");
 const actual=saldoDe(estado,id);
 if(tipo==="SALIDA"&&cantidad>actual)throw Error("La salida supera la existencia.");
 if(tipo==="ENTRADA"&&!Number.isSafeInteger(actual+cantidad))throw Error("Cantidad fuera de rango.");
 return {...estado,movimientos:[...estado.movimientos,{id:uid,materialId:id,tipo,cantidad,fecha}]};
}
function celdaCSV(valor){let s=String(valor);if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
function exportarCSV(estado){
 const filas=[["Movimiento","Fecha","MaterialId","Material","Tipo","Cantidad"]];
 for(const m of estado.movimientos)filas.push([m.id,m.fecha,m.materialId,estado.materiales.find(x=>x.id===m.materialId)?.nombre||m.materialId,m.tipo,m.cantidad]);
 return "\uFEFF"+filas.map(f=>f.map(celdaCSV).join(";")).join("\r\n");
}
if(typeof document!=="undefined"){
 const el=id=>document.getElementById(id),clave="et505-s9-kardex-v1";
 let estado={materiales:[],movimientos:[]},bloqueado=false;
 const mensaje=t=>{el("k-mensaje").textContent=t;};
 try{const texto=localStorage.getItem(clave);if(texto){const d=JSON.parse(texto);if(!Array.isArray(d.materiales)||!Array.isArray(d.movimientos))throw Error();estado=d;}}
 catch{bloqueado=true;mensaje("No se pudo leer el almacenamiento. Conserve/exporte su copia; no se sobrescribirá. Revise con el docente.");}
 function guardar(nuevo){if(bloqueado)throw Error("Almacenamiento bloqueado para conservar la copia.");localStorage.setItem(clave,JSON.stringify(nuevo));estado=nuevo;dibujar();}
 function elegido(){return estado.materiales.find(x=>x.id===el("k-material").value&&x.activo);}
 function seguro(fn){try{fn();}catch(e){mensaje(e.message||"No se pudo guardar. Conserve su estado anterior.");}}
 function dibujar(){
  const filtro=el("k-buscar").value.trim().toLocaleLowerCase(),previo=el("k-material").value;
  el("k-material").replaceChildren();
  const vacio=document.createElement("option");vacio.value="";vacio.textContent="Seleccione";el("k-material").append(vacio);
  for(const m of estado.materiales.filter(x=>x.activo&&(x.nombre.toLocaleLowerCase().includes(filtro)||x.id.toLocaleLowerCase().includes(filtro)))){const o=document.createElement("option");o.value=m.id;o.textContent=m.nombre+" · "+m.id;el("k-material").append(o);}
  if([...el("k-material").options].some(x=>x.value===previo))el("k-material").value=previo;
  el("k-saldo").textContent=saldoDe(estado,el("k-material").value);
  el("k-filas").replaceChildren();
  for(const m of estado.movimientos){const tr=document.createElement("tr");for(const v of [m.fecha,estado.materiales.find(x=>x.id===m.materialId)?.nombre||m.materialId,m.tipo,m.cantidad]){const td=document.createElement("td");td.textContent=v;tr.append(td);}el("k-filas").append(tr);}
  if(filtro&&el("k-material").options.length===1)mensaje("Sin coincidencias. Ningún dato fue modificado.");
 }
 el("k-buscar").addEventListener("input",dibujar);
 el("k-material").addEventListener("change",()=>{el("k-saldo").textContent=saldoDe(estado,el("k-material").value);});
 el("k-material-form").addEventListener("submit",e=>{e.preventDefault();seguro(()=>{
  const nombre=el("k-nombre").value.trim();if(nombre.length<3)throw Error("Use al menos3caracteres.");
  guardar({...estado,materiales:[...estado.materiales,{id:crypto.randomUUID(),nombre,activo:true}]});mensaje("Material creado. Selecciónelo antes de registrar movimientos.");
 });});
 el("k-mov-form").addEventListener("submit",e=>{e.preventDefault();seguro(()=>{
  guardar(agregarMovimiento(estado,el("k-material").value,el("k-tipo").value,Number(el("k-cantidad").value),crypto.randomUUID(),new Date().toISOString()));mensaje("Movimiento guardado.");
 });});
 el("k-renombrar").addEventListener("click",()=>seguro(()=>{const m=elegido();if(!m)throw Error("Seleccione material.");const nombre=prompt("Nuevo nombre",m.nombre);if(nombre===null)return;if(nombre.trim().length<3)throw Error("Use al menos3caracteres.");guardar({...estado,materiales:estado.materiales.map(x=>x.id===m.id?{...x,nombre:nombre.trim()}:x)});mensaje("Nombre cambiado por id. Los demás materiales se conservan.");}));
 el("k-retirar").addEventListener("click",()=>seguro(()=>{const m=elegido();if(!m)throw Error("Seleccione material.");const tiene=estado.movimientos.some(x=>x.materialId===m.id);if(!confirm((tiene?"Inactivar ":"Eliminar ")+m.nombre+"?"))return;guardar({...estado,materiales:tiene?estado.materiales.map(x=>x.id===m.id?{...x,activo:false}:x):estado.materiales.filter(x=>x.id!==m.id)});mensaje(tiene?"Material inactivo. Historial conservado.":"Material sin movimientos eliminado.");}));
 el("k-exportar").addEventListener("click",()=>{const b=new Blob([exportarCSV(estado)],{type:"text/csv;charset=utf-8;"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="movimientos-materiales.csv";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);});
 dibujar();
}
if(typeof module!=="undefined")module.exports={saldoDe,agregarMovimiento,exportarCSV};
