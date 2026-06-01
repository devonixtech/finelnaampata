import os
import re

out_lines = []
for root, dirs, files in os.walk(r'c:\Users\Ahmed Bilal Khan\Desktop\business-directory\apps\web'):
    if '.next' in root or 'node_modules' in root or 'out' in root or 'dist' in root or 'scratch' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith(('.tsx', '.ts', '.jsx', '.js', '.css', '.html')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                try:
                    lines = f.readlines()
                except UnicodeDecodeError:
                    continue
            for i, line in enumerate(lines):
                if 'Vendor' in line or 'vendor' in line or 'VENDOR' in line:
                    if 'import' in line or 'api.vendor' in line or 'user?.vendor' in line or 'user.vendor' in line or 'user?.role' in line or 'user.role' in line or 'from \"' in line or 'from \'' in line:
                        continue
                    if re.search(r'([A-Za-z]Vendor|Vendor[A-Za-z])', line): # Like VendorProfile, isVendor
                        continue
                    if re.search(r'([A-Za-z]vendor|vendor[A-Za-z])', line): # Like vendorId, vendorListings
                        continue
                    if '<Vendor' in line or '</Vendor' in line:
                        continue
                    if 'vendor:' in line or 'vendor?' in line or 'vendor=' in line or 'vendor.' in line or '{vendor' in line or '[vendor' in line or '(vendor' in line or ' vendor)' in line or 'vendor =>' in line:
                        continue
                    if 'vendors/' in line or '/vendor' in line or '/vendors' in line:
                        continue
                    if '//' in line.strip()[:2] or '/*' in line.strip()[:2] or '*' in line.strip()[:1]:
                        continue
                    if 'className=' in line and 'vendor' in line:
                        continue
                    out_lines.append(f'{filepath}:{i+1} - {line.strip()}')
                    
with open('vendor_ui_scan.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out_lines))
