/** Server-side reference C only. Never import from public DTOs or client components. */

export const REFERENCE_SOLUTIONS: Record<string, string> = {
  "hello-cforge": `#include <stdio.h>
int main(void){puts("Hello, CForge!"); return 0;}
`,
  "add-two-integers": `#include <stdio.h>
int main(void){int a,b; if(scanf("%d %d",&a,&b)!=2) return 1; printf("%d\\n",a+b); return 0;}
`,
  "echo-integer": `#include <stdio.h>
int main(void){int n; if(scanf("%d",&n)!=1) return 1; printf("%d\\n",n); return 0;}
`,
  "integer-remainder": `#include <stdio.h>
int main(void){int a,b; if(scanf("%d %d",&a,&b)!=2) return 1; printf("%d\\n",a%b); return 0;}
`,
  "max-of-two": `#include <stdio.h>
int main(void){int a,b; if(scanf("%d %d",&a,&b)!=2) return 1; printf("%d\\n", a>b?a:b); return 0;}
`,
  "letter-grade": `#include <stdio.h>
int main(void){int m; if(scanf("%d",&m)!=1) return 1;
  if(m>=90) puts("A"); else if(m>=75) puts("B"); else if(m>=50) puts("C"); else puts("F");
  return 0;}
`,
  "sum-one-to-n": `#include <stdio.h>
int main(void){int n; if(scanf("%d",&n)!=1) return 1; int s=0; for(int i=1;i<=n;i++) s+=i; printf("%d\\n",s); return 0;}
`,
  "array-sum": `#include <stdio.h>
int main(void){int n; if(scanf("%d",&n)!=1) return 1; int s=0,x; for(int i=0;i<n;i++){if(scanf("%d",&x)!=1) return 1; s+=x;} printf("%d\\n",s); return 0;}
`,
  "string-length-manual": `#include <stdio.h>
int main(void){char s[65]; if(scanf("%64s",s)!=1) return 1; int n=0; while(s[n]) n++; printf("%d\\n",n); return 0;}
`,
  "swap-two-addresses": `#include <stdio.h>
void swap(int *a,int *b){int t=*a;*a=*b;*b=t;}
int main(void){int x,y; if(scanf("%d %d",&x,&y)!=2) return 1; swap(&x,&y); printf("%d %d\\n",x,y); return 0;}
`,
  "factorial-recursive": `#include <stdio.h>
int fact(int n){return n<=1?1:n*fact(n-1);}
int main(void){int n; if(scanf("%d",&n)!=1) return 1; printf("%d\\n",fact(n)); return 0;}
`,
  "linear-search-index": `#include <stdio.h>
int main(void){int n; if(scanf("%d",&n)!=1) return 1; int a[32];
  for(int i=0;i<n;i++) if(scanf("%d",&a[i])!=1) return 1;
  int key; if(scanf("%d",&key)!=1) return 1; int ans=-1;
  for(int i=0;i<n;i++) if(a[i]==key){ans=i; break;}
  printf("%d\\n",ans); return 0;}
`,
  "min-of-three-ternary": `#include <stdio.h>
int main(void){int a,b,c; if(scanf("%d %d %d",&a,&b,&c)!=3) return 1;
  int m=a<b?a:b; m=m<c?m:c; printf("%d\\n",m); return 0;}
`,
  "evaluate-with-precedence": `#include <stdio.h>
int main(void){int a,b,c; if(scanf("%d %d %d",&a,&b,&c)!=3) return 1;
  printf("%d\\n",a+b*c); return 0;}
`,
  "skip-multiples-continue": `#include <stdio.h>
int main(void){int n,k; if(scanf("%d %d",&n,&k)!=2) return 1;
  int first=1;
  for(int i=1;i<=n;i++){
    if(i%k==0) continue;
    if(!first) putchar(' ');
    printf("%d",i); first=0;
  }
  putchar('\\n'); return 0;}
`,
  "count-digits-while": `#include <stdio.h>
int main(void){int n; if(scanf("%d",&n)!=1) return 1;
  int d=1; while(n>=10){n/=10; d++;} printf("%d\\n",d); return 0;}
`,
  "matrix-2x2-sum": `#include <stdio.h>
int main(void){int m[2][2],s=0;
  for(int i=0;i<2;i++) for(int j=0;j<2;j++){if(scanf("%d",&m[i][j])!=1) return 1; s+=m[i][j];}
  printf("%d\\n",s); return 0;}
`,
  "string-equal-strcmp": `#include <stdio.h>
#include <string.h>
int main(void){char a[33],b[33]; if(scanf("%32s %32s",a,b)!=2) return 1;
  puts(strcmp(a,b)==0?"equal":"differ"); return 0;}
`,
  "square-return": `#include <stdio.h>
int square(int n){return n*n;}
int main(void){int n; if(scanf("%d",&n)!=1) return 1; printf("%d\\n",square(n)); return 0;}
`,
  "array-max-argument": `#include <stdio.h>
int amax(int *a,int n){int m=a[0]; for(int i=1;i<n;i++) if(a[i]>m) m=a[i]; return m;}
int main(void){int n; if(scanf("%d",&n)!=1) return 1; int a[32];
  for(int i=0;i<n;i++) if(scanf("%d",&a[i])!=1) return 1;
  printf("%d\\n",amax(a,n)); return 0;}
`,
  "binary-search-index": `#include <stdio.h>
int main(void){int n; if(scanf("%d",&n)!=1) return 1; int a[32];
  for(int i=0;i<n;i++) if(scanf("%d",&a[i])!=1) return 1;
  int key; if(scanf("%d",&key)!=1) return 1;
  int lo=0,hi=n-1,ans=-1;
  while(lo<=hi){int mid=lo+(hi-lo)/2; if(a[mid]>=key){if(a[mid]==key) ans=mid; hi=mid-1;} else lo=mid+1;}
  printf("%d\\n",ans); return 0;}
`,
  "bubble-sort-asc": `#include <stdio.h>
int main(void){int n; if(scanf("%d",&n)!=1) return 1; int a[32];
  for(int i=0;i<n;i++) if(scanf("%d",&a[i])!=1) return 1;
  for(int i=0;i<n;i++) for(int j=0;j<n-1-i;j++) if(a[j]>a[j+1]){int t=a[j]; a[j]=a[j+1]; a[j+1]=t;}
  for(int i=0;i<n;i++){if(i) putchar(' '); printf("%d",a[i]);}
  putchar('\\n'); return 0;}
`,
};

export function referenceSolution(slug: string) {
  return REFERENCE_SOLUTIONS[slug];
}
