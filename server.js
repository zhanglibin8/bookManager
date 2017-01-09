var http = require('http');
var fs = require('fs');
var url = require('url');
var mime = require('mime');

function getBooks(callback) {
    fs.readFile('./book.json','utf8',function (err, data) {
        if(err){
            callback([]);
        }else {
            callback(JSON.parse(data))
        }
    })
}
function setBooks(data, callback) {
    fs.writeFile('./book.json',JSON.stringify(data),callback)
}

var server = http.createServer(function (req, res) {
    var urlObj = url.parse(req.url,true);
    var pathname = urlObj.pathname;
    if(pathname=='/'){
        res.setHeader('content-type','text/html;charset=utf8');
        fs.createReadStream('./index.ejs').pipe(res);
    }else if(/\/books(\/\d+)?/.test(pathname)){
        var id = /\/books(\/(\d+))?/.exec(pathname)[2];
        switch (req.method){
            case 'GET':
                if(id){
                    getBooks(function (data) {
                        var book = data.find(function (item) {
                            return item.id == id;
                        });
                        res.end(JSON.stringify(book));
                    })
                }else {
                    getBooks(function (data) {
                        res.end(JSON.stringify(data));
                    })
                }
                break;
            case 'POST':
                var str = '';
                req.on('data',function (data) {
                    str+= data;
                });
                req.on('end',function () {
                    var book = JSON.parse(str);
                    getBooks(function (data) {
                        book.id = data.length?parseInt(data[data.length-1].id)+1:1;
                        data.push(book);
                        setBooks(data,function () {
                            res.end(JSON.stringify(book));
                        })
                    })
                });
                break;
            case 'DELETE':
                if(id){
                    getBooks(function (data) {
                        data = data.filter(function (item) {
                            return item.id!=id;
                        });
                        setBooks(data,function () {
                            res.end(JSON.stringify({}));
                        })
                    })
                }
                break;
            case 'PUT':
                if(id){
                    var str = '';
                    req.on('data',function (data) {
                        str+= data;
                    });
                    req.on('end',function () {
                        var book = JSON.parse(str);
                        getBooks(function (data) {
                            data = data.map(function (item) {
                                if(item.id == id){
                                    return book;
                                }
                                return item;
                            });
                            setBooks(data,function () {
                                res.end(JSON.stringify(book));
                            })
                        })
                    })
                }
                break;
        }

    }
    else {
        fs.exists('.'+pathname,function (flag) {
            if(flag){
                res.setHeader('content-type',mime.lookup(pathname)+';charset=utf8');
                fs.createReadStream('.'+pathname).pipe(res);
            }else {
                res.statusCode = 404;
                res.end('NOT FOUND');
            }
        })
    }

});
server.listen(3000,function () {
    console.log('ok-3000')
});
