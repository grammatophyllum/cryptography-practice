from Crypto.Util.number import long_to_bytes, inverse
from factordb.factordb import FactorDB

c=6237745251830987616657691814320483745464624712282971846715
n=6396959152725160364204672238499322570376859599356909043929
e=65537

f = FactorDB(n)
f.connect()
factors = f.get_factor_list() # 2 factors

phi = 1
for f in factors:
    phi *= (f-1)

print(factors)
d = inverse(e, phi) # Common error: inverse(phi, e)
m = str(long_to_bytes(pow(c, d, n)))
print(m)