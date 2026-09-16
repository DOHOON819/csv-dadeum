export function parseCSV(input,delimiter=','){
 if(![',',';','\t','|'].includes(delimiter))throw new Error('지원하지 않는 구분자입니다.');
 const text=input.replace(/^\ufeff/,'');if(!text)return [];
 const rows=[];let row=[],cell='',quoted=false,closed=false,position=0;
 const pushCell=()=>{row.push(cell);cell='';closed=false;if(row.length>200)throw new Error('한 행에 200열까지 검사할 수 있습니다.');};
 const pushRow=()=>{pushCell();rows.push(row);row=[];if(rows.length>20000)throw new Error('한 번에 20,000행까지 검사할 수 있습니다.');};
 for(let i=0;i<text.length;i++){
   const char=text[i];position=i;
   if(quoted){if(char==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=char;continue;}
   if(char===delimiter){pushCell();continue;}
   if(char==='\r'||char==='\n'){if(char==='\r'&&text[i+1]==='\n')i++;pushRow();continue;}
   if(closed)throw new Error(`${rows.length+1}행: 닫는 따옴표 뒤에는 구분자나 줄바꿈만 올 수 있습니다.`);
   if(char==='"'){if(cell)throw new Error(`${rows.length+1}행: 셀 중간에 따옴표가 있습니다. 셀 전체를 따옴표로 감싸세요.`);quoted=true;}else cell+=char;
 }
 if(quoted)throw new Error(`${rows.length+1}행: 따옴표가 닫히지 않았습니다. (문자 ${position+1})`);
 if(cell||row.length||closed||!/[\r\n]$/.test(text))pushRow();
 return rows;
}
export function inspect(rows,header=true){
 const width=rows[0]?.length||0,data=header?rows.slice(1):rows,seen=new Set();let duplicates=0,empty=0;
 for(const row of data){if(row.every(x=>x.trim()===''))empty++;const key=JSON.stringify(row);if(seen.has(key))duplicates++;else seen.add(key);}
 const irregular=rows.flatMap((row,i)=>row.length!==width?[i+1]:[]);
 const headers=header&&rows.length?rows[0]:[],unique=new Set();let duplicateHeaders=0;
 for(const name of headers){if(unique.has(name))duplicateHeaders++;unique.add(name);}
 return {rows:data.length,columns:width,duplicates,empty,irregular,duplicateHeaders,emptyHeaders:headers.filter(x=>!x.trim()).length};
}
export function cleanRows(rows,{header=true,trim=false,dedupe=false,empty=false}={}){
 let result=rows.map(row=>row.map(cell=>trim?cell.trim():cell));const title=header&&result.length?result.shift():null;
 if(empty)result=result.filter(row=>row.some(cell=>cell.trim()!==''));
 if(dedupe){const seen=new Set();result=result.filter(row=>{const key=JSON.stringify(row);if(seen.has(key))return false;seen.add(key);return true;});}
 return title?[title,...result]:result;
}
export function serializeCSV(rows,{delimiter=',',safe=true,bom=true}={}){
 return (bom?'\ufeff':'')+rows.map(row=>row.map(cell=>{
   let value=String(cell);if(safe&&/^[\s\u0000-\u001f]*[=+@-]/u.test(value))value="'"+value;
   return /["\r\n]/.test(value)||value.includes(delimiter)?'"'+value.replace(/"/g,'""')+'"':value;
 }).join(delimiter)).join('\r\n');
}
