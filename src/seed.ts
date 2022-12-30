import axios from 'axios';
import cheerio from 'cheerio';
import mysql from 'mysql';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || '';
const connection = mysql.createConnection(connectionString);
connection.connect();



const getCharacterPageNames = async () => {
    const url = 'https://throneofglass.fandom.com/wiki/Category:Kingdom_of_Ash_characters';

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const categories = $('ul.category-page__members-for-char');
    const characterPageNames = [];

    for(let i = 0; i < categories.length; i++) {
        const ul = categories[i];
        const characterLIs = $(ul).find('li.category-page__member');

        for(let j = 0; j < characterLIs.length; j++) {
            const li = characterLIs[j];
            const path = $(li).children('a').text();
            characterPageNames.push(path);            
        }

    }

    return characterPageNames;


}

const getCharacterInfo = async (characterName : string) => {
   const { data } = await axios.get(`https://throneofglass.fandom.com/wiki/${characterName}`);
   const $ = cheerio.load(data);

   let name = $('h2[data-source="name"]').text();
   let image = $('.image.image-thumbnail > img').attr('src');
   let species = $('div[data-source="species"] > div a').text();


   const characterInfo = {
    name, image, species
   }

   return characterInfo;

}

const loadCharacters = async() => {
    const characterPageNames = await getCharacterPageNames();

    const characterInfoArr = [];
    for(let i = 0; i < characterPageNames.length; i++) {
        const characterInfo = await getCharacterInfo(characterPageNames[i]);
        characterInfoArr.push(characterInfo);
    }

    const values = characterInfoArr.map((character, i) => [i, character.name, character.species, character.image]);

    const sql = "INSERT INTO Characters (id, name, species, image) VALUES ?";
    connection.query(sql, [values], (err) => {
        if(err) {
            console.log(err);
        } else {
            console.log('YEEEY!');
        }
    })


}

loadCharacters();