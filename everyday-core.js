export function percentage(mode,a,b){
  if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a)>1e12||Math.abs(b)>1e12)throw new Error('Enter valid numbers between −1 trillion and 1 trillion.');
  const format=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:6}).format(n);
  let value,formula,label='Your answer',extra='';
  if(mode==='of'){value=a/100*b;formula=`${format(a)} ÷ 100 × ${format(b)}`;}
  else if(mode==='share'){if(b===0)throw new Error('The total cannot be zero.');value=a/b*100;formula=`${format(a)} ÷ ${format(b)} × 100`;label='Percentage';}
  else if(mode==='change'){if(a<=0)throw new Error('Enter an original value greater than zero.');value=(b-a)/a*100;formula=`(${format(b)} − ${format(a)}) ÷ ${format(a)} × 100`;label=value<0?'Decrease':value>0?'Increase':'No change';}
  else if(mode==='discount'){if(a<0||b<0||b>100)throw new Error('Price must be zero or more, and discount must be between 0 and 100%.');value=a*(1-b/100);formula=`${format(a)} × (1 − ${format(b)} ÷ 100)`;label='Sale price';extra=`You save ${format(a*b/100)} in the same currency as your original price.`;}
  else throw new Error('Choose a calculation.');
  const result=format(value)+(mode==='share'||mode==='change'?'%':'');
  return {value,result,formula:formula+' = '+result,label,extra};
}
export function remainingSeconds(end,now){return Math.max(0,Math.ceil((end-now)/1000));}
export function validDuration(value,max){const n=Number(value);if(!Number.isInteger(n)||n<1||n>max)throw new Error(`Enter a whole number from 1 to ${max} minutes.`);return n;}
