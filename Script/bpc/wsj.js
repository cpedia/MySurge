let url = $request.url
let body = $response.body

if (/<\/html>|<\/body>/.test(body)) {
    body = body.replace('</body>', `

<script type="text/javascript" async="" charset="utf-8" 
    src="https://gitlab.com/magnolia1234/bypass-paywalls-clean-filters/-/raw/main/userscript/bpc.en.user.js?ref_type=heads"> 
</script></body>`)

    console.log('Success')
}

$done({ body })