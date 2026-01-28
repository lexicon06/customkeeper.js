<h1>👕 Custom Names & Wardrobe System (sb0t Script)</h1>

<p>
A persistent <strong>custom name / wardrobe system</strong> for sb0t-based chat servers.
Users can save, switch, cycle, and delete custom display names ("ropas" / "nicks")
with a clean letter-based menu and automatic persistence using SQLite.
</p>

<hr/>

<h2>🧠 Features</h2>

<ul>
  <li>✅ Persistent custom names stored in SQLite</li>
  <li>✅ Automatic restore of last used name on join</li>
  <li>✅ Letter-based menu (no numbers, no spam)</li>
  <li>✅ Cycle names forward / backward</li>
  <li>✅ Safe deletion with active-name handling</li>
  <li>✅ Auto-fallback when active name is removed</li>
  <li>✅ Zero user configuration required</li>
</ul>

<hr/>

<h2>🧩 Commands</h2>

<table>
  <thead>
    <tr>
      <th>Command</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/ropas</code></td>
      <td>Show saved custom names (wardrobe)</td>
    </tr>
    <tr>
      <td><code>/nicks</code></td>
      <td>Alias for <code>/ropas</code></td>
    </tr>
    <tr>
      <td><code>/borrar</code></td>
      <td>Delete a saved custom name</td>
    </tr>
    <tr>
      <td><code>/nextc</code></td>
      <td>Switch to next saved name</td>
    </tr>
    <tr>
      <td><code>/prevc</code></td>
      <td>Switch to previous saved name</td>
    </tr>
  </tbody>
</table>

<hr/>

<h2>📜 How It Works</h2>

<ol>
  <li>When a user joins, the script restores their last used custom name.</li>
  <li>If a user sets a new custom name, it is saved automatically.</li>
  <li>Menus use <strong>letters (a–z)</strong> instead of numbers.</li>
  <li>Only one menu is active per user to avoid conflicts.</li>
  <li>Deleting the active name automatically selects a fallback.</li>
</ol>

<hr/>

<h2>🗄️ Database Schema</h2>

<pre>
custom_names
---------------------------------------
custom_name_id   INTEGER (PK)
username         NVARCHAR(255)
display_name     NVARCHAR(255)
last_used        DATETIME
created_date     DATETIME
</pre>

<p>
The database file is created automatically:
</p>

<pre>
cn.db
</pre>

<hr/>

<h2>⚙️ Installation</h2>

<ol>
  <li>Copy the script into your sb0t scripts directory</li>
  <li>Restart the bot or reload scripts</li>
  <li>The database initializes automatically on first run</li>
</ol>

<hr/>

<h2>🛠️ Tech Stack</h2>

<p>
  <img src="https://img.shields.io/badge/JavaScript-sb0t-yellow?style=for-the-badge&logo=javascript" />
  <img src="https://img.shields.io/badge/SQLite-Database-blue?style=for-the-badge&logo=sqlite" />
  <img src="https://img.shields.io/badge/sb0t-Chat%20Bot-orange?style=for-the-badge" />
</p>

<hr/>

<h2>👤 Author</h2>

<p>
<strong>Pablo Santillán</strong><br/>
GitHub: <a href="https://github.com/lexicon06" target="_blank">https://github.com/lexicon06</a>
</p>

<hr/>

<h2>📄 License</h2>

<p>
This project is provided as-is for sb0t community usage.
You are free to modify and extend it for your own servers.
</p>
