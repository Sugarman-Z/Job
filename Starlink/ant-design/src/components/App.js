import '../styles/App.css';
import React, { useState } from "react";
import { Button, Radio } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

function App() {
  const [size, setSize] = useState("large");

  const handleSizeChange = e => {
    console.log(e.target.value);
    setSize(e.target.value);
  };

  return (
      <div className="ant">
          <div className="header"><h1 className="header">W3School.com.cn</h1></div>



          <div className="content">
              <div className="left"><p>"Never increase, beyond what is necessary, the number of entities required to explain anything." William of Ockham (1285-1349)</p></div>
              <div className="right">
                  <h2>Free Web Building Tutorials</h2>
                  <p>At W3School.com.cn you will find all the Web-building tutorials you need,
                      from basic HTML and XHTML to advanced XML, XSL, Multimedia and WAP.</p>
                  <p>W3School.com.cn - The Largest Web Developers Site On The Net!</p>
              </div>
          </div>

          <div className="footer">Copyright 2008 by YingKe Investment.</div>


      </div>
  );
}

export default App;
